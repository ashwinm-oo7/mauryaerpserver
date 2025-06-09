const express = require("express");
const router = express.Router();
const {
  createMenu,
  getMenus,
  updateMenu,
  deleteMenu,
  getMenuById,
} = require("../controllers/menuController");

// POST route to save menu
router.post("/", createMenu);
router.post("/menus", createMenu);
router.get("/getMenus", getMenus);
router.get("/getMenuById/:id", getMenuById); // <-- New line

router.put("/updateMenu/:id", updateMenu);
router.delete("/deleteMenu/:id", deleteMenu);

module.exports = router;
