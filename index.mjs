import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "neo4j-driver";

// schema

const typeDefs = `#graphql
    type Query {
        fuzzyBusinessByName(searchString: String): [Business!]!
        @cypher(
            statement:
            """
            CALL db.index.fulltext.queryNodes( 'businessNameIndex', $searchString+'~')
            YIELD node RETURN node
            """
            columnName: "result"
        )
    }
    type Business {
    businessId: ID!
    waitTime: Int!
    averageStars: Float!
    @cypher(
        statement: "MATCH (this)<-[:REVIEWS]-(r:Review) RETURN avg(r.stars)"
        columnName: "result"
        )
    recommended(first: Int = 1): [Business!]!
    @cypher(
        statement:
        """
        MATCH (this)<-[:REVIEWS]-(:Review)<-[:WROTE]-(:User)-[:WROTE]->(:Review)-[:REVIEWS]->(rec:Business)
        WITH rec, COUNT(*) AS score
        RETURN rec ORDER BY score DESC LIMIT $first
        """
        columnName: "result"
    )
    name: String!
    city: String!
    state: String!
    address: String!
    location: Point!
    reviews: [Review!]! @relationship(type: "REVIEWS", direction: IN)
    categories: [Category!]! @relationship(type: "IN_CATEGORY", direction: OUT)
    }

    type User {
    userID: ID!
    name: String!
    reviews: [Review!]! @relationship(type: "WROTE", direction: OUT)
    }

    type Review {
    reviewId: ID!
    stars: Float!
    date: Date!
    text: String
    user: User! @relationship(type: "WROTE", direction: IN)
    business: Business! @relationship(type: "REVIEWS", direction: OUT)
  }

  type Category {
    name: String!
    businesses: [Business!]! @relationship(type: "IN_CATEGORY", direction: IN)
  }
`;

// resolvers

const resolvers = {
    Business: {
      waitTime: (obj, args, context, info) => {
        var options = [0, 5, 10, 15, 30, 45];
        return options[Math.floor(Math.random() * options.length)];
      },
    },
  };
  

// apollo server

const driver = neo4j.driver(
    "bolt://54.82.232.78:7687",
    neo4j.auth.basic("neo4j", "rack-grinders-steams")
);

const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers, driver, config: 
  {
    jwt: {
      jwksEndpoint: https://dev-0zpw8pjgpe085nnn.us.auth0.com/.well-known/jwks.json,
    }
  } 
});

const server = new ApolloServer({
    schema: await neoSchema.getSchema(),
});

const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => ({ req }),
    listen: { port: 4000 },
});

console.log(`🚀 Server ready at ${url}`);