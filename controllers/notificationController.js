import Notification from "../models/notificationModel.js";

export const getNotifications = async (req, res) => {
  const userId = req.user._id;
  try {
    const notifications = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profileImg",
    });
    await Notification.updateMany({ to: userId }, { read: true });
    return res.status(200).json(notifications);
  } catch (error) {
    console.log("Error in Get Notifications controller", error.message);
    res.status(400).json({ error: "Internal Server Error" });
  }
};

export const deleteNotifications = async (req, res) => {
  const userId = req.user._id;
  try {
    await Notification.deleteMany({ to: userId });
    return res
      .status(200)
      .json({ message: "Notifications Deleted Successfully" });
  } catch (error) {
    console.log("Error in Delete Notifications controller", error.message);
    res.status(400).json({ error: "Internal Server Error" });
  }
};

export const deleteNotification = async (req, res) => {
  const { id: notificationId } = req.params;
  const userId = req.user._id;
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification)
      return res.status(404).json({ error: "Notification Not Found" });

    if (notification.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You are not Allowed to delete this notification" });
    }
    await Notification.findByIdAndDelete(notificationId);

    return res
      .status(200)
      .json({ message: "Notification Deleted Successfully" });
  } catch (error) {
    console.log("Error in Delete Notification controller", error.message);
    res.status(400).json({ error: "Internal Server Error" });
  }
};
