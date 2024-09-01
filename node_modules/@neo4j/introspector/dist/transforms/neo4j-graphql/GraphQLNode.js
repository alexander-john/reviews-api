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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLNode = void 0;
class GraphQLNode {
    constructor(type, typeName) {
        this.fields = [];
        this.directives = [];
        this.type = type;
        this.typeName = typeName;
    }
    addDirective(d) {
        this.directives.push(d);
    }
    addField(field) {
        this.fields.push(field);
    }
    toString() {
        const parts = [];
        let innerParts = [];
        const typeRow = [];
        typeRow.push(this.type, this.typeName);
        if (this.directives.length) {
            typeRow.push(this.directives.map((d) => d.toString()).join(" "));
        }
        typeRow.push("{");
        innerParts = innerParts.concat(this.fields.sort((a, b) => (a.name > b.name ? 1 : -1)).map((field) => field.toString()));
        parts.push(typeRow.join(" "));
        parts.push(innerParts);
        parts.push(`}`);
        return parts.map((p) => (Array.isArray(p) ? `\t${p.join("\n\t")}` : p)).join("\n");
    }
}
exports.GraphQLNode = GraphQLNode;
//# sourceMappingURL=GraphQLNode.js.map