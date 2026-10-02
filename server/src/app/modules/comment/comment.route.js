const router = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const controller = require("./comment.controller");
const run = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

router.use(auth);
router.get("/:taskId/comments", run(controller.list));
router.post("/:taskId/comments", run(controller.create));
router.delete("/:taskId/comments/:commentId", run(controller.remove));

module.exports = router;
