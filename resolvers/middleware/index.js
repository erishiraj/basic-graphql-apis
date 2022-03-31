const {skip} = require("graphql-resolvers");
const taskModel = require("../../database/models/task");
const {isValidObjectId} = require("../../database/utils");

const isAuthenticated = (_, __, {email}) => {
  if (!email) {
    throw new Error("Access Denied! please login to continue");
  }
  skip;
};

const isTaskOwner = async (_, {id}, {loggedInUserId}) => {
  try {
    if (!isValidObjectId(id)) {
      throw new Error("Invalid task id!");
    }
    const task = await taskModel.findById(id);
    if (!task) {
      throw new Error("Task not found!");
    } else if (task.user.toString() !== loggedInUserId) {
      throw new Error("not authorized as task owner!");
    }
    return skip;
  } catch (error) {
    throw error;
  }
};
module.exports = {
  isAuthenticated,
  isTaskOwner,
};
