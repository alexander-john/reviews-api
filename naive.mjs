import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

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
      if (
        context &&
        context.headers &&
        context.headers.authorization === "Bearer authorized123"
      ) {
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
    return { headers: req.headers };
  },
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);