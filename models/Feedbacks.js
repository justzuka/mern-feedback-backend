const mongoose = require("mongoose");

const FeedbackSchema = mongoose.Schema({
	head: {
		type: String,
		required: true,
	},
	info: {
		type: String,
		required: true,
	},
	tag: {
		type: String,
		required: true,
	},
	voteCount: {
		type: Number,
		default: 0,
		required: true,
	},
	commentCount: {
		type: Number,
		default: 0,
		required: true,
	},

	createdAt: {
		type: Date,
		default: () => Date.now(),
	},

	userIdsLiked: [
		{
			type: String,
		},
	],

	comments: { type: Array, default: [] },
});

const FeedbackModel = mongoose.model("feedbacks", FeedbackSchema);

module.exports = FeedbackModel;
