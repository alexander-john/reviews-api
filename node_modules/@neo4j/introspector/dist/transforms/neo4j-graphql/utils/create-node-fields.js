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
const debug_1 = __importDefault(require("debug"));
const NodeField_1 = require("../NodeField");
const constants_1 = require("../../../constants");
const map_neo4j_to_graphql_type_1 = __importDefault(require("./map-neo4j-to-graphql-type"));
const debug = (0, debug_1.default)(constants_1.DEBUG_INFER_SCHEMA);
function createNodeFields(propertyRows, elementType) {
    const out = [];
    propertyRows.forEach((propertyRow) => {
        if (!propertyRow.types) {
            if (debug.enabled) {
                debug("%s", `No properties on ${elementType}. Skipping generation.`);
            }
            return;
        }
        if (propertyRow.types.length > 1) {
            if (debug.enabled) {
                debug("%s", `Ambiguous types on ${elementType}.${propertyRow.name}. Fix the inconsistencies for this property to be included`);
            }
            return;
        }
        out.push(new NodeField_1.NodeField(propertyRow.name, (0, map_neo4j_to_graphql_type_1.default)(propertyRow.types, propertyRow.mandatory)));
    });
    return out;
}
exports.default = createNodeFields;
//# sourceMappingURL=create-node-fields.js.map