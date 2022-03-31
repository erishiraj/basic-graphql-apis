const express = require("express");
const {ApolloServer, gql} = require("apollo-server-express");
const cors = require("cors");
const dotenv = require("dotenv");
const Dataloader = require("dataloader");

const resolvers = require("./resolvers");
const typeDefs = require("./typeDefs");
const {connection} = require("./database/utils");
const verifyUser = require("./helper/context");
const loaders = require("./loader");

dotenv.config();

const app = express();
connection();
app.use(cors());

app.use(express.json());

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: async (req, res) => {
    await verifyUser(req);
    return {
      email: req.email,
      loggedInUserId: req.loggedInUserId,
      loaders: {
        user: new Dataloader((keys) => loaders.user.batchUsers(keys)),
      },
    };
  },
});

async function startOne() {
  await apolloServer.start();
  apolloServer.applyMiddleware({app, path: "/graphql"});
}
startOne();

app.get("/", (req, res, next) => {
  res.send("<div>Hello</div>");
});

const httpServer = app.listen(process.env.PORT, () => {
  console.log(
    `Sever running on ${process.env.PORT} \nGraphql Endpoint ${apolloServer.graphqlPath}`
  );
});
