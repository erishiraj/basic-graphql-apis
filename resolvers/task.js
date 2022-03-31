const {combineResolvers} = require("graphql-resolvers");

const userModel = require("../database/models/user");
const taskModel = require("../database/models/task");
const {isAuthenticated, isTaskOwner} = require("./middleware");
const {stringToBase64, base64ToString} = require("../helper");

module.exports = {
  Query: {
    tasks: combineResolvers(
      isAuthenticated,
      async (_, {cursor, limit = 10}, {loggedInUserId}) => {
        try {
          const query = {user: loggedInUserId};
          if (cursor) {
            query["_id"] = {
              $lt: base64ToString(cursor),
            };
          }
          let tasks = await taskModel
            .find(query)
            .sort({_id: -1})
            .limit(limit + 1);

          const hasNextPage = tasks.length > limit;
          tasks = hasNextPage ? tasks.slice(0, -1) : tasks;
          return {
            taskFeed: tasks,
            pageInfo: {
              nextPageCursor: hasNextPage
                ? stringToBase64(tasks[tasks.length - 1].id)
                : null,
              hasNextPage,
            },
          };
        } catch (error) {
          console.log(error);
          throw error;
        }
      }
    ),
    task: combineResolvers(isAuthenticated, isTaskOwner, async (_, {id}) => {
      try {
        const task = await taskModel.findById(id);
        return task;
      } catch (error) {
        console.log(error);
        throw error;
      }
    }),
  },
  Mutation: {
    createTask: combineResolvers(
      isAuthenticated,
      async (_, {input}, {email}) => {
        try {
          const user = await userModel.findOne({email});
          const task = new taskModel({
            ...input,
            user: user.id,
          });

          const result = await task.save();
          user.tasks.push(result.id);
          await user.save();
          return result;
        } catch (error) {
          console.log(error);
          throw error;
        }
      }
    ),
    updateTask: combineResolvers(
      isAuthenticated,
      isTaskOwner,
      async (_, {id, input}) => {
        try {
          const task = await taskModel.findByIdAndUpdate(
            id,
            {...input},
            {new: true}
          );
          return task;
        } catch (error) {
          console.log(error);
          throw error;
        }
      }
    ),
    deleteTask: combineResolvers(
      isAuthenticated,
      isTaskOwner,
      async (_, {id}, {loggedInUserId}) => {
        try {
          const task = await taskModel.findByIdAndDelete(id);
          await userModel.updateOne(
            {_id: loggedInUserId},
            {$pull: {tasks: task.id}}
          );
          return task;
        } catch (error) {
          console.log(error);
          throw error;
        }
      }
    ),
  },
  Task: {
    user: async (parent, _, {loaders}) => {
      try {
        const user = await loaders.user.load(parent.user.toString());
        return user;
      } catch (error) {
        throw error;
      }
    },
  },
};
