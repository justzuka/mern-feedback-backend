const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const UserModel = require("./models/Users");
const FeedbackModel = require("./models/Feedbacks");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

require("dotenv").config();
const PORT = 3001;
const jwt = require("jsonwebtoken");
const SECRET = "dfghjakcgavjbjk1235!@)(#&!(#";
const CONNECTION_URL =
	"mongodb+srv://justzuka:zukax326@cluster0.dbvdaqw.mongodb.net/?retryWrites=true&w=majority";
app.use(bodyParser.json({ limit: "30mb", extended: true }));
//whahaat
app.use(cors());
mongoose
	.connect(CONNECTION_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() =>
		app.listen(process.env.PORT, () =>
			console.log(`Server running on port: ${PORT}`)
		)
	)
	.catch((error) => console.log(error.message));

app.get("/users", (req, res) => {
	UserModel.find({}, (err, result) => {
		if (err) {
			res.json({ status: "error", message: err });
		} else {
			res.json({ status: "ok", data: result });
		}
	});
});
app.get("/", (req, res) => {
	res.send(" hi ");
});
app.post("/registerUser", async (req, res) => {
	console.log("in register");
	try {
		const us = await UserModel.findOne({ email: req.body.email });

		if (us) {
			console.log("sending status error");
			res.json({ status: "error", message: "Email exists" });
		} else {
			const newPassword = await bcrypt.hash(req.body.password, 10);
			const user = new UserModel({
				name: req.body.name,
				email: req.body.email,
				password: newPassword,
			});
			await user.save();
			console.log("sending status ok");
			res.json({ status: "ok", data: user });
		}
	} catch (error) {
		console.log("catched error");
		res.json({ status: "error", message: error });
	}
});

app.post("/loginUser", async (req, res) => {
	try {
		const us = await UserModel.findOne({ email: req.body.email });

		if (!us) {
			res.json({ status: "error", message: "Email is not registered" });
		} else {
			const isPasswordValid = await bcrypt.compare(
				req.body.password,
				us.password
			);
			if (isPasswordValid) {
				const token = jwt.sign(
					{
						name: us.name,
						email: us.email,
					},
					SECRET
				);

				return res.json({
					status: "ok",
					data: token,
					userId: us._id,
					name: us.name,
				});
			} else {
				return res.json({ status: "error", message: "invalid password" });
			}
		}
	} catch (error) {
		res.json({ status: "error", message: "some error" });
	}
});

app.post("/getUserName", async (req, res) => {
	const token = req.body.token;

	try {
		const decoded = jwt.verify(token, SECRET);
		const email = decoded.email;
		const user = await UserModel.findOne({ email: email });

		return res.json({ status: "ok", data: user.name });
	} catch (error) {
		res.json({ status: "error", message: "invalid token" });
	}
});

app.post("/feedbacks", async (req, res) => {
	const token = req.body.token;

	try {
		const decoded = jwt.verify(token, SECRET);
		let filterObj = {};

		if (req.body.tag === "All" || req.body.tag === undefined) {
		} else {
			filterObj = { tag: req.body.tag };
		}

		const PAGE_SIZE = 4;
		const page = parseInt(req.query.page || "0");
		const total = await FeedbackModel.countDocuments(filterObj);
		const feedbacks = await FeedbackModel.find(filterObj)
			.limit(PAGE_SIZE)
			.skip(PAGE_SIZE * page);
		res.json({
			status: "ok",
			data: {
				totalPages: Math.ceil(total / PAGE_SIZE),
				feedbacks,
			},
		});
	} catch (error) {
		res.json({ status: "error", message: "invalid token" });
	}
});

app.post("/addfeedback", async (req, res) => {
	const token = req.body.token;

	try {
		const decoded = jwt.verify(token, SECRET);
		const feedback = new FeedbackModel({
			head: req.body.header,
			info: req.body.info,
			tag: req.body.tag,
		});
		feedback.save();
		res.json({
			status: "ok",
			data: feedback,
		});
	} catch (error) {
		console.log("----------");
		console.log(error);
		console.log("----------");
		res.json({ status: "error", message: "invalid token" });
	}
});

app.post("/like", async (req, res) => {
	const token = req.body.token;

	try {
		const decoded = jwt.verify(token, SECRET);
		const email = decoded.email;
		const user = await UserModel.findOne({ email: email });
		const userId = user._id;
		const feedbackId = req.body._id;
		FeedbackModel.findByIdAndUpdate(
			feedbackId,
			{
				$push: { userIdsLiked: userId },
				$inc: { voteCount: 1 },
			},
			{
				new: true,
			}
		).exec((err, result) => {
			if (err) {
				res.json({ status: "error", message: "could not update" });
			} else {
				res.json({ status: "ok", data: result });
			}
		});
	} catch (error) {
		res.json({ status: "error", message: "invalid token" });
	}
});
app.post("/unlike", async (req, res) => {
	const token = req.body.token;

	try {
		const decoded = jwt.verify(token, SECRET);
		const email = decoded.email;
		const user = await UserModel.findOne({ email: email });
		const userId = user._id;
		const feedbackId = req.body._id;
		FeedbackModel.findByIdAndUpdate(
			feedbackId,
			{
				$pull: { userIdsLiked: userId },
				$inc: { voteCount: -1 },
			},
			{
				new: true,
			}
		).exec((err, result) => {
			if (err) {
				res.json({ status: "error", message: "could not update" });
			} else {
				res.json({ status: "ok", data: result });
			}
		});
	} catch (error) {
		res.json({ status: "error", message: "invalid token" });
	}
});

app.post("/addcomment", async (req, res) => {
	const token = req.body.token;

	try {
		const decoded = jwt.verify(token, SECRET);
		const name = decoded.name;
		const info = req.body.info;
		const feedbackId = req.body._id;

		FeedbackModel.findByIdAndUpdate(
			feedbackId,
			{
				$push: {
					comments: {
						name,
						info,
					},
				},
				$inc: { commentCount: 1 },
			},
			{
				new: true,
			}
		).exec((err, result) => {
			if (err) {
				res.json({ status: "error", message: "could not add comment" });
			} else {
				res.json({ status: "ok", data: result });
			}
		});
	} catch (error) {
		res.json({ status: "error", message: "invalid token" });
	}
});

app.post("/feedback", async (req, res) => {
	const token = req.body.token;
	try {
		const decoded = jwt.verify(token, SECRET);
		const feedbackId = req.body._id;

		const feedback = await FeedbackModel.findOne({ _id: feedbackId });
		res.json({ status: "ok", data: feedback });
	} catch (error) {
		res.json({ status: "error", message: "invalid token" });
	}
});
