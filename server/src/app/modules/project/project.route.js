const router = require("express").Router();
const auth = require("../../middlewares/authMiddleware");
const controller = require("./project.controller");

const run = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

router.use(auth);

router.get("/", run(controller.list));
router.post("/", run(controller.create));
router.post("/:id/members", run(controller.addMember));
router.get("/:id", run(controller.get));
router.patch("/:id", run(controller.update));
router.delete("/:id", run(controller.remove));

module.exports = router;
