const mongoose = require("mongoose");
const { getCurrentUserId } = require("../../middleware/requestContext");

function ownershipPlugin(schema) {
  if (!schema.path("userId")) {
    schema.add({
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    });
  }

  const attachUserIdToQuery = function attachUserIdToQuery() {
    const userId = getCurrentUserId();
    if (!userId) return;

    const query = this.getQuery();
    if (!query.userId) {
      this.where({ userId });
    }
  };

  schema.pre(/^find/, attachUserIdToQuery);
  schema.pre(/^count/, attachUserIdToQuery);
  schema.pre(/^update/, attachUserIdToQuery);
  schema.pre(/^delete/, attachUserIdToQuery);
  schema.pre(/^findOneAnd/, attachUserIdToQuery);

  schema.pre("aggregate", function attachUserIdToAggregate() {
    const userId = getCurrentUserId();
    if (!userId) return;

    const pipeline = this.pipeline();
    const matchStage = { $match: { userId: new mongoose.Types.ObjectId(userId) } };

    if (pipeline[0] && pipeline[0].$geoNear) {
      pipeline.splice(1, 0, matchStage);
    } else {
      pipeline.unshift(matchStage);
    }
  });

  schema.pre("save", function attachUserIdToDoc(next) {
    const userId = getCurrentUserId();
    if (!this.userId && userId) {
      this.userId = userId;
    }
    next();
  });

}

module.exports = ownershipPlugin;
