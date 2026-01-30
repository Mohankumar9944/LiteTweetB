import Posts from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import Notification from "../models/notificationModel.js";

export const createPost = async (req, res) => {
  const { text } = req.body;
  let { img } = req.body;
  try {
    const userId = req.user._id.toString();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User Not Found" });

    if (!text && !img) {
      return res.status(400).json({ error: "Post must have text or image" });
    }
    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }
    const newPost = new Posts({
      user: userId,
      text,
      img,
    });
    await newPost.save();
    return res.status(201).json(newPost);
  } catch (error) {
    console.log("Error in Create Post controller", error.message);
    res.status(400).json({ error: "Internal Server Error" });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Posts.findById(id);
    if (!post) return res.status(404).json({ error: "Post Not Found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ error: "You are not Authorized to Delete This Post" });
    }

    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }
    await Posts.findByIdAndDelete(id);
    return res.status(200).json({ message: "Post Deleted Successfully" });
  } catch (error) {
    console.log("Error in Delete Post controller", error.message);
    res.status(400).json({ error: "Internal Server Error" });
  }
};

export const commentOnPost = async (req, res) => {
  const { text } = req.body;
  const { postId } = req.params;
  const userId = req.user._id;
  try {
    if (!text) return res.status(400).json({ error: "Text field is required" });

    const post = await Posts.findById(postId);
    if (!post) return res.status(404).json({ error: "Post Not Found" });

    const comment = { user: userId, text };
    post.comments.push(comment);
    await post.save();

    return res.status(200).json(post);
  } catch (error) {
    console.log("Error in Comment on Post controller", error.message);
    res.status(400).json({ error: "Internal Server Error" });
  }
};

export const likeUnlikePost = async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user._id;
  try {
    const post = await Posts.findById(postId);
    if (!post) return res.status(404).json({ error: "Post Not Found" });

    const userLikedPost = post.likes.includes(userId);
    if (userLikedPost) {
      await Posts.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
      const updatedLikes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );

      return res.status(200).json(updatedLikes);
    } else {
      post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
      await post.save();

      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notification.save();
      const updatedLikes = post.likes;
      return res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.log("Error in Like Or UnLike Post controller", error.message);
    res.status(400).json({ error: "Internal Server Error" });
  }
};

export const getAllPosts = async (req, res) => {
  const userId = req.user._id;
  try {
    const posts = await Posts.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    if (posts.length === 0) {
      return res.status(200).json([]);
    }
    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error in get All Posts controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getLikedPosts = async (req, res) => {
  const { id: userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User Not Found" });
    const likedPosts = await Posts.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    return res.status(200).json(likedPosts);
  } catch (error) {
    console.log("Error in get Liked Posts controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User Not Found" });

    const following = user.following;
    const feedPosts = await Posts.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    return res.status(200).json(feedPosts);
  } catch (error) {
    console.log("Error in get Following Posts controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserPosts = async (req, res) => {
  const { username } = req.params;
  const userId = req.user._id;
  try {
    const user = User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User Not Found" });

    const posts = await Posts.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error in get User Posts controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
