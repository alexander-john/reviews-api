"use strict";
/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./classes/Node"));
const Property_1 = __importDefault(require("./classes/Property"));
const Relationship_1 = __importDefault(require("./classes/Relationship"));
const clean_type_name_1 = __importDefault(require("./utils/clean-type-name"));
const escape_label_1 = require("./utils/escape-label");
const node_key_1 = __importDefault(require("./utils/node-key"));
async function toNeo4jStruct(sessionFactory) {
    const nodes = await introspectNodes(sessionFactory);
    const relationships = await introspectRelationships(sessionFactory);
    return { nodes, relationships };
}
exports.default = toNeo4jStruct;
async function introspectNodes(sessionFactory) {
    const nodes = {};
    // Label properties
    const session = sessionFactory();
    const labelPropsRes = await session.readTransaction((tx) => tx.run(`CALL db.schema.nodeTypeProperties()
    YIELD nodeType, nodeLabels, propertyName, propertyTypes, mandatory
    RETURN *`));
    await session.close();
    if (!labelPropsRes?.records.length) {
        return nodes;
    }
    const nodeTypeProperties = labelPropsRes.records.map((r) => r.toObject());
    new Set(nodeTypeProperties.map((nt) => nt.nodeType)).forEach((nodeType) => {
        const propertiesRows = nodeTypeProperties.filter((nt) => nt.nodeType === nodeType);
        if (!propertiesRows) {
            return;
        }
        const { nodeLabels } = propertiesRows[0];
        const node = new Node_1.default(nodeType, nodeLabels);
        propertiesRows.forEach((p) => {
            if (!p.propertyName) {
                return;
            }
            node.addProperty(new Property_1.default(p.propertyName, p.propertyTypes, p.mandatory));
        });
        nodes[nodeType] = node;
    });
    return nodes;
}
async function introspectRelationships(sessionFactory) {
    const relSession = sessionFactory();
    const rels = {};
    // Find all relationship types and their properties (if any)
    const typePropsRes = await relSession.readTransaction((tx) => tx.run(`CALL db.schema.relTypeProperties()
    YIELD relType, propertyName, propertyTypes, mandatory
    RETURN *`));
    await relSession.close();
    const relTypePropertiesRecords = typePropsRes.records.map((r) => r.toObject());
    const uniqueRelTypes = new Set(relTypePropertiesRecords.map((nt) => nt.relType));
    const queries = [];
    // Go through each unique relationship type and check
    // what node labels are connected with it
    uniqueRelTypes.forEach((relType) => {
        const propertiesRows = relTypePropertiesRecords.filter((nt) => nt.relType === relType);
        if (!propertiesRows) {
            return;
        }
        // Check node identifiers it's connected to
        // Run in parallel
        async function sessionClosure() {
            const conSession = sessionFactory();
            await new Promise((r) => {
                setTimeout(r, 3000);
            });
            const escapedType = (0, escape_label_1.escapeLabel)((0, clean_type_name_1.default)(relType));
            const relationshipsRes = await conSession.readTransaction((tx) => tx.run(`
            MATCH (n)-[r:${escapedType}]->(m)
            WITH n, r, m LIMIT 100
            WITH DISTINCT labels(n) AS from, labels(m) AS to
            WITH from, to WHERE SIZE(from) > 0 AND SIZE(to) > 0
            RETURN from, to, "${relType.replace(/"/g, '\\"')}" AS relType`));
            await conSession.close();
            return relationshipsRes;
        }
        queries.push(sessionClosure());
        const typeOnly = (0, clean_type_name_1.default)(relType);
        const relationship = new Relationship_1.default(typeOnly);
        if (propertiesRows.length) {
            propertiesRows.forEach((p) => {
                if (!p.propertyName) {
                    return;
                }
                relationship.addProperty(new Property_1.default(p.propertyName, p.propertyTypes, p.mandatory));
            });
        }
        rels[typeOnly] = relationship;
    });
    const results = await Promise.all(queries);
    // Go through each unique path and add it to the relationship type
    results.forEach((result) => {
        const paths = result.records.map((r) => r.toObject());
        if (!paths) {
            return;
        }
        const { relType } = paths[0];
        const typeOnly = (0, clean_type_name_1.default)(relType);
        const relationship = rels[typeOnly];
        paths.forEach(({ from, to }) => relationship.addPath((0, node_key_1.default)(from), (0, node_key_1.default)(to)));
    });
    return rels;
}
//# sourceMappingURL=to-internal-struct.js.map