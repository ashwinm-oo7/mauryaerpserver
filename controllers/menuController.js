const Menu = require("../models/MenuModel");

// @desc    Get all menus
// @route   GET /api/menus
exports.getMenus = async (req, res) => {
  try {
    const menus = await Menu.find({});
    res.json(menus);
  } catch (err) {
    console.error("Error fetching menus:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch menus", error: err.message });
  }
};

exports.createMenus = async (req, res) => {
  try {
    const {
      bname,
      tablename = "",
      MenuName = "",
      ParentSubmenuName = "",
      FormType = "M",
      Active = true,
    } = req.body;

    // ✅ 1. Validate required field
    if (!bname || typeof bname !== "string" || bname.trim() === "") {
      return res
        .status(400)
        .json({ message: "bname is required and must be a non-empty string." });
    }

    // ✅ 2. Validate FormType
    const allowedFormTypes = ["M", "T", "R", "I"];
    if (!allowedFormTypes.includes(FormType)) {
      return res.status(400).json({
        message: `FormType must be one of: ${allowedFormTypes.join(", ")}`,
      });
    }

    // ✅ 3. Check for duplicate bname (case-insensitive)
    const existing = await Menu.findOne({
      bname: { $regex: new RegExp(`^${bname}$`, "i") },
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: `Menu with bname "${bname}" already exists.` });
    }

    // ✅ 4. Create and save the new menu
    const newMenu = new Menu({
      bname: bname.trim(),
      tablename,
      MenuName,
      ParentSubmenuName,
      FormType,
      Active,
    });

    const savedMenu = await newMenu.save();
    res.status(201).json(savedMenu);
  } catch (err) {
    console.error("Error saving menu:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

exports.createMenu = async (req, res) => {
  try {
    const {
      bname,
      tablename = "",
      MenuName = "",
      ParentSubmenuName = "",
      FormType = "M",
      Active = true,
      controls = [],
    } = req.body;

    if (!bname || typeof bname !== "string" || bname.trim() === "") {
      return res.status(400).json({ message: "bname is required" });
    }

    const allowedFormTypes = ["M", "T", "R", "I"];
    if (!allowedFormTypes.includes(FormType)) {
      return res.status(400).json({
        message: `FormType must be one of: ${allowedFormTypes.join(", ")}`,
      });
    }

    const existing = await Menu.findOne({
      bname: { $regex: new RegExp(`^${bname}$`, "i") },
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: `Menu with bname "${bname}" already exists.` });
    }

    // ✅ Validate and sanitize controls array if present
    const sanitizedControls = controls.map((ctrl) => {
      if (!["input", "checkbox", "dropdown"].includes(ctrl.controlType)) {
        throw new Error(`Invalid controlType: ${ctrl.controlType}`);
      }
      if (!ctrl.label || typeof ctrl.label !== "string") {
        throw new Error("Each control must have a valid label");
      }
      return {
        controlType: ctrl.controlType,
        label: ctrl.label,
        options:
          ctrl.controlType === "dropdown" && Array.isArray(ctrl.options)
            ? ctrl.options
            : [],
      };
    });

    const newMenu = new Menu({
      bname: bname.trim(),
      tablename,
      MenuName,
      ParentSubmenuName,
      FormType,
      Active,
      controls: sanitizedControls,
    });

    const savedMenu = await newMenu.save();
    res.status(201).json(savedMenu);
  } catch (err) {
    console.error("Error saving menu:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

// @desc    Update a menu by id
// @route   PUT /api/menus/:id
exports.updateMenu = async (req, res) => {
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return the updated document
      runValidators: true,
    });
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }
    res.json(menu);
  } catch (err) {
    console.error("Error updating menu:", err);
    res
      .status(500)
      .json({ message: "Failed to update menu", error: err.message });
  }
};

// @desc    Delete a menu by id
// @route   DELETE /api/menus/:id
exports.deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }
    res.json({ message: "Menu deleted successfully" });
  } catch (err) {
    console.error("Error deleting menu:", err);
    res
      .status(500)
      .json({ message: "Failed to delete menu", error: err.message });
  }
};
