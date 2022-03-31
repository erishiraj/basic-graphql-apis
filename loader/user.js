const userModel = require("../database/models/user");

module.exports.batchUsers = async (userIds) => {
  console.log("keys ===", userIds);
  const users = await userModel.find({id: {$in: userIds}});
  return userIds.map((userId) => users.find((user) => user.id === userId));
};
