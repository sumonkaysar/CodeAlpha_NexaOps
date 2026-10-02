const router = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const controller = require("./task.controller");
const run = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

router.use(auth);
router.get("/", run(controller.list));
router.post("/", run(controller.create));
router.patch("/:id", run(controller.update));
router.delete("/:id", run(controller.remove));
module.exports = router;
