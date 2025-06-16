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

// @desc    Get a single menu by ID
// @route   GET /api/menus/getMenus/:id
exports.getMenuById = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    res.json(menu);
  } catch (err) {
    console.error("Error fetching menu by ID:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch menu", error: err.message });
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
      type = "", // New: Menu type from frontend
    } = req.body;
    // ✅ Type validation
    if (type && !["menu", "submenu", "form"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Invalid type. Must be menu, submenu, or form." });
    }

    if (type === "menu") {
      if (!MenuName || ParentSubmenuName || tablename) {
        return res.status(400).json({
          message: `For type=menu, only 'MenuName' should be filled.`,
        });
      }
    }

    if (type === "submenu") {
      if (!MenuName || !ParentSubmenuName || tablename) {
        return res.status(400).json({
          message: `For type=submenu, 'MenuName' and 'ParentSubmenuName' are required. 'tablename' must be empty.`,
        });
      }
    }

    if (type === "form") {
      const validFormCaseA = MenuName && !ParentSubmenuName && tablename;
      const validFormCaseB = MenuName && ParentSubmenuName && tablename;
      const validFormCaseE = !MenuName && !ParentSubmenuName && tablename;
      if (!tablename || !(validFormCaseA || validFormCaseB || validFormCaseE)) {
        return res.status(400).json({
          message: `For type=form, 'tablename' is required. Must match a valid form combination.`,
        });
      }
    }
    if (!bname || typeof bname !== "string" || bname.trim() === "") {
      return res.status(400).json({ message: "bname is required" });
    }
    if (!["menu", "submenu", "form"].includes(type)) {
      return res.status(400).json({
        message: `Type must be one of: menu, submenu, form`,
      });
    }

    const allowedFormTypes = ["M", "MD", "T", "R", "I"];
    if (!allowedFormTypes.includes(FormType)) {
      return res.status(400).json({
        message: `FormType must be one of: ${allowedFormTypes.join(", ")}`,
      });
    }

    const labels = controls.map((ctrl) =>
      typeof ctrl.label === "string" ? ctrl.label.trim().toLowerCase() : ""
    );

    const hasDuplicateLabels = labels.some(
      (label, idx) => labels.indexOf(label) !== idx
    );
    if (hasDuplicateLabels) {
      return res
        .status(400)
        .json({ message: "Control labels must be unique within the form." });
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
      if (!ctrl.label.trim()) {
        res.status(400).json({
          message: "Control label cannot be empty or whitespace only",
          error: err.message,
        });
      }

      if (!ctrl.label || typeof ctrl.label !== "string") {
        throw new Error("Each control must have a valid label");
      }
      const allowedDatatypes = ["nvarchar", "int", "bigint", "decimal"];
      if (ctrl.datatype && !allowedDatatypes.includes(ctrl.datatype)) {
        throw new Error(`Invalid datatype: ${ctrl.datatype}`);
      }

      const needsOptions = ["dropdown", "input"].includes(ctrl.controlType);

      const baseControl = {
        controlType: ctrl.controlType,
        label: ctrl.label,
        required: !!ctrl.required, // ✅ Ensure boolean

        // options:
        //   needsOptions && Array.isArray(ctrl.options) ? ctrl.options : [],
      };
      if (
        needsOptions &&
        Array.isArray(ctrl.options) &&
        ctrl.options.length > 0
      ) {
        baseControl.options = ctrl.options;
      }

      if (
        ctrl.controlType === "dropdown" &&
        typeof ctrl.sabtable === "string"
      ) {
        baseControl.sabtable = ctrl.sabtable.trim();
      }
      if (
        ctrl.dataType &&
        ["nvarchar", "int", "bigint", "decimal"].includes(ctrl.dataType)
      ) {
        baseControl.dataType = ctrl.dataType;

        if (["nvarchar", "int", "bigint", "decimal"].includes(ctrl.dataType)) {
          baseControl.size = Number(ctrl.size) || null;
        }
        if (["int", "bigint", "decimal"].includes(ctrl.dataType)) {
          baseControl.length = Number(ctrl.length) || null;
        }

        if (ctrl.dataType === "decimal" && ctrl.decimals !== undefined) {
          baseControl.decimals = Number(ctrl.decimals) || 0;
        }
      }

      return baseControl;
    });
    // const pid = await getNextSequence("saberpmenu_seq"); // Your logic to generate pid

    const newMenu = new Menu({
      // pid,
      bname: bname.trim(),
      tablename,
      MenuName,
      ParentSubmenuName,
      FormType,
      Active,
      controls: sanitizedControls,
      type, // ✅ store menu type
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
    const {
      bname,
      tablename,
      MenuName,
      ParentSubmenuName,
      FormType,
      Active,
      controls = [],
      type = "",
    } = req.body;
    console.log("frontend Controls:", controls);

    // Validate FormType if provided
    const allowedFormTypes = ["M", "MD", "T", "R", "I"];
    if (FormType && !allowedFormTypes.includes(FormType)) {
      return res.status(400).json({
        message: `FormType must be one of: ${allowedFormTypes.join(", ")}`,
      });
    }
    const labels = controls.map((ctrl) =>
      typeof ctrl.label === "string" ? ctrl.label.trim().toLowerCase() : ""
    );
    const hasDuplicateLabels = labels.some(
      (label, idx) => labels.indexOf(label) !== idx
    );
    if (hasDuplicateLabels) {
      return res
        .status(400)
        .json({ message: "Control labels must be unique within the form." });
    }

    // ✅ Clean up controls
    let sanitizedControls = undefined;
    if (Array.isArray(controls)) {
      sanitizedControls = controls.map((ctrl) => {
        if (!["input", "checkbox", "dropdown"].includes(ctrl.controlType)) {
          throw new Error(`Invalid controlType: ${ctrl.controlType}`);
        }

        if (!ctrl.label || typeof ctrl.label !== "string") {
          throw new Error("Each control must have a valid label");
        }

        const baseControl = {
          controlType: ctrl.controlType,
          label: ctrl.label,
          required: !!ctrl.required, // ✅ Ensure boolean

          // options:
          //   ctrl.controlType === "dropdown" && Array.isArray(ctrl.options)
          //     ? ctrl.options
          //     : [],
        };
        // ✅ Include options if relevant
        if (
          ["input", "dropdown"].includes(ctrl.controlType) &&
          Array.isArray(ctrl.options) &&
          ctrl.options.length > 0
        ) {
          baseControl.options = ctrl.options;
        }

        if (
          ctrl.controlType === "dropdown" &&
          typeof ctrl.sabtable === "string"
        ) {
          baseControl.sabtable = ctrl.sabtable.trim();
        }
        if (ctrl.dataType) {
          baseControl.dataType = ctrl.dataType;

          if (
            ["nvarchar", "int", "bigint", "decimal"].includes(ctrl.dataType)
          ) {
            baseControl.size = Number(ctrl.size) || null;
          }
          if (["int", "bigint", "decimal"].includes(ctrl.dataType)) {
            baseControl.length = Number(ctrl.length) || null;
          }

          if (ctrl.dataType === "decimal" && ctrl.decimals !== undefined) {
            baseControl.decimals = Number(ctrl.decimals) || 0;
          }
        }

        return baseControl;
      });
    }
    console.log("Sanitized Controls:", sanitizedControls);

    // Build update object
    const updateFields = {
      ...(bname && { bname }),
      ...(tablename && { tablename }),
      ...(MenuName && { MenuName }),
      ...(ParentSubmenuName && { ParentSubmenuName }),
      ...(FormType && { FormType }),
      ...(Active !== undefined && { Active }),
      ...(sanitizedControls && { controls: sanitizedControls }),
      ...(type && { type }),
    };

    const menu = await Menu.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
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
