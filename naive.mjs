import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import jwt from 'jsonwebtoken';

const peopleArray = [
  {
    name: "Bob",
  },
  {
    name: "Lindsey",
  },
];

const typeDefs = /* GraphQL */ `
  type Query {
    people: [Person]
  }

  type Person {
    name: String
  }
`;

const resolvers = {
  Query: {
    people: (obj, args, context, info) => {
      if (context.user) {
        return peopleArray;
      } else {
        throw new Error("You are not authorized");
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  
});

const { url } = await startStandaloneServer(server, {
  context: ({ req }) => {
    let decoded;
    if (req && req.headers && req.headers.authorization) {
      try {
        decoded = jwt.verify(
          req.headers.authorization.slice(7),
          "Dpwm9XXKqk809WXjCsOmRSZQ5i5fXw8N"
        );
      } catch (e) {
        // token not valid
        console.log(e);
      }
    }
    return {
      user: decoded,
    };
  },
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);