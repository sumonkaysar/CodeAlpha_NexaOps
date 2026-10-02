const router = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const controller = require("./notification.controller");

router.use(auth);

router.get("/", controller.list);
router.patch("/:id/read", controller.markRead);

module.exports = router;
