const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {combineResolvers} = require("graphql-resolvers");
const {isAuthenticated} = require("./middleware");

const {users, tasks} = require("../constant");
const userModel = require("../database/models/user");
const taskModel = require("../database/models/task");

module.exports = {
  Query: {
    user: combineResolvers(isAuthenticated, async (_, {id}, {email}) => {
      try {
        const user = await userModel.findOne({email});
        if (!user) {
          throw new Error("User not found!");
        }
        return user;
      } catch (error) {
        throw error;
      }
    }),
  },
  Mutation: {
    signup: async (_, {input}) => {
      try {
        const user = await userModel.findOne({email: input.email});
        if (user) {
          throw new Error("Email already in use");
        }
        const hashPassword = await bcryptjs.hash(input.password, 12);
        const newUser = new userModel({...input, password: hashPassword});
        const result = await newUser.save();
        return result;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
    login: async (_, {input}) => {
      try {
        const user = await userModel.findOne({email: input.email});
        if (!user) {
          throw new Error("User not found!");
        }

        const isPasswordValid = await bcryptjs.compare(
          input.password,
          user.password
        );
        if (!isPasswordValid) {
          throw new Error("Incorrect Password");
        }

        const token = await jwt.sign(
          {email: user.email},
          process.env.JWT_SECRET_KEY,
          {expiresIn: "1d"}
        );
        console.log("user", user, isPasswordValid, token);
        return {token};
      } catch (error) {
        throw new Error(error);
      }
    },
  },
  User: {
    tasks: async ({id}) => {
      try {
        const task = await taskModel.find({user: id});
        return task;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
  },
};
