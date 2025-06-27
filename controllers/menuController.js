const Menu = require("../models/MenuModel");

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
      subControls = [], // ✅ NEW
      type = "", // New: Menu type from frontend
    } = req.body;
    // ✅ Type validation
    if (type && !["menu", "submenu", "form"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Invalid type. Must be menu, submenu, or form." });
    }

    if (type === "menu") {
      if (!bname || !FormType || !Active || ParentSubmenuName || tablename) {
        return res.status(400).json({
          message: `For type=menu, only 'MenuName' should be filled.`,
        });
      }
    }

    if (type === "submenu") {
      if (!MenuName || ParentSubmenuName || tablename) {
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
      if (
        !["input", "checkbox", "dropdown", "grid"].includes(ctrl.controlType)
      ) {
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
      const allowedDatatypes = ["nvarchar", "int", "bigint", "decimal", "date"];
      if (ctrl.datatype && !allowedDatatypes.includes(ctrl.datatype)) {
        throw new Error(`Invalid datatype: ${ctrl.datatype}`);
      }

      const needsOptions = ["dropdown", "input"].includes(ctrl.controlType);

      const baseControl = {
        controlType: ctrl.controlType,
        label: ctrl.label.trim(),
        header: ctrl.header,
        required: !!ctrl.required, // ✅ Ensure boolean
        readOnly: !!ctrl.readOnly, // ✅ Add this line

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
        ["nvarchar", "int", "bigint", "decimal", "date", "sequence"].includes(
          ctrl.dataType
        )
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
        if (ctrl.dataType === "sequence") {
          baseControl.dataType = ctrl.dataType;
          baseControl.entnoFormat = ctrl.entnoFormat || "";

          // Set autoGenerate if entnoFormat is provided
          baseControl.autoGenerate =
            ctrl.entnoFormat && ctrl.entnoFormat.trim() !== "" ? true : false;
        }
        if (ctrl.dataType === "date" && ctrl.defaultDateOption) {
          const allowedDateOptions = ["currentDate"];
          if (!allowedDateOptions.includes(ctrl.defaultDateOption)) {
            throw new Error(
              `Invalid defaultDateOption: ${ctrl.defaultDateOption}`
            );
          }
          baseControl.defaultDateOption = ctrl.defaultDateOption;
        }
      }
      // ✅ Grid sub-controls
      if (ctrl.controlType === "grid" && Array.isArray(ctrl.subControls)) {
        baseControl.subControls = ctrl.subControls.map((sub) => {
          if (!["input", "checkbox", "dropdown"].includes(sub.controlType)) {
            throw new Error(`Invalid subControlType: ${sub.controlType}`);
          }
          if (
            sub.operationRule &&
            typeof sub.operationRule === "object" &&
            sub.operationRule.leftOperand &&
            sub.operationRule.rightOperand &&
            ["+", "-", "*", "/"].includes(sub.operationRule.operator)
          ) {
            base.operationRule = {
              leftOperand: sub.operationRule.leftOperand,
              operator: sub.operationRule.operator,
              rightOperand: sub.operationRule.rightOperand,
            };
          }

          return {
            controlType: sub.controlType,
            label: sub.label.trim(),
            required: !!sub.required,
            readOnly: !!sub.readOnly,
            sabtable: sub.sabtable?.trim(),
            options: sub.options || [],
            dataType: sub.dataType,
            size: sub.size || undefined,
            length: sub.length || undefined,
            decimals:
              sub.dataType === "decimal" ? sub.decimals || 0 : undefined,
            defaultDateOption:
              sub.dataType === "date" ? sub.defaultDateOption : undefined,
            sumRequired: !!sub.sumRequired, // ✅ Save sumRequired
          };
        });
      }

      return baseControl;
    });
    // const pid = await getNextSequence("saberpmenu_seq"); // Your logic to generate pid
    // ✅ Validate & sanitize subControls (grid columns)
    const sanitizedSubControls = subControls.map((sub) => {
      if (!["input", "checkbox", "dropdown"].includes(sub.controlType)) {
        throw new Error(`Invalid subControlType: ${sub.controlType}`);
      }
      if (!sub.label || typeof sub.label !== "string") {
        throw new Error("Each subControl must have a valid label");
      }

      const base = {
        controlType: sub.controlType,
        label: sub.label.trim(),
        required: !!sub.required,
        readOnly: !!sub.readOnly,
      };

      if (sub.options && Array.isArray(sub.options)) base.options = sub.options;
      if (sub.sabtable) base.sabtable = sub.sabtable.trim();
      if (sub.dataType) {
        base.dataType = sub.dataType;
        base.size = sub.size || undefined;
        base.length = sub.length || undefined;
        if (sub.dataType === "decimal") base.decimals = sub.decimals || 0;
        if (sub.dataType === "date" && sub.defaultDateOption) {
          base.defaultDateOption = sub.defaultDateOption;
        }
      }

      return base;
    });

    const newMenu = new Menu({
      // pid,
      bname: bname.trim(),
      tablename,
      MenuName,
      ParentSubmenuName,
      FormType,
      Active,
      controls: sanitizedControls,
      // subControls: sanitizedSubControls,
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
        if (
          !["input", "checkbox", "dropdown", "grid"].includes(ctrl.controlType)
        ) {
          throw new Error(`Invalid controlType: ${ctrl.controlType}`);
        }

        if (!ctrl.label || typeof ctrl.label !== "string") {
          throw new Error("Each control must have a valid label");
        }

        const baseControl = {
          controlType: ctrl.controlType,
          label: ctrl.label,
          required: !!ctrl.required, // ✅ Ensure boolean
          readOnly: !!ctrl.readOnly, // ✅ Add this line

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
        if (
          ctrl.dataType &&
          ["nvarchar", "int", "bigint", "decimal", "date", "sequence"].includes(
            ctrl.dataType
          )
        ) {
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
          if (ctrl.dataType === "date" && ctrl.defaultDateOption) {
            const allowedDateOptions = ["currentDate"];
            if (!allowedDateOptions.includes(ctrl.defaultDateOption)) {
              throw new Error(
                `Invalid defaultDateOption: ${ctrl.defaultDateOption}`
              );
            }
            baseControl.defaultDateOption = ctrl.defaultDateOption;
          }
          if (ctrl.dataType === "sequence") {
            baseControl.dataType = ctrl.dataType;
            baseControl.entnoFormat = ctrl.entnoFormat || "";

            // Set autoGenerate if entnoFormat is provided
            baseControl.autoGenerate =
              ctrl.entnoFormat && ctrl.entnoFormat.trim() !== "" ? true : false;
          }
        }
        // ✅ Handle subControls only if controlType is grid
        if (ctrl.controlType === "grid" && Array.isArray(ctrl.subControls)) {
          baseControl.subControls = ctrl.subControls.map((sub) => {
            if (!["input", "checkbox", "dropdown"].includes(sub.controlType)) {
              throw new Error(`Invalid subControlType: ${sub.controlType}`);
            }

            const base = {
              controlType: sub.controlType,
              label: sub.label.trim(),
              header: sub.header,
              required: !!sub.required,
              readOnly: !!sub.readOnly,
              // sumRequired: !!sub.sumRequired,
            };

            if (
              ["int", "decimal", "bigint"].includes(sub.dataType) &&
              sub.sumRequired
            ) {
              base.sumRequired = !!sub.sumRequired;
            }

            if (sub.controlType === "dropdown" && sub.sabtable) {
              base.sabtable = sub.sabtable.trim();
            }

            if (sub.dataType) {
              base.dataType = sub.dataType;
              base.size = sub.size || undefined;
              base.length = sub.length || undefined;

              if (sub.dataType === "decimal") {
                base.decimals = sub.decimals || 0;
              }

              if (sub.dataType === "date" && sub.defaultDateOption) {
                base.defaultDateOption = sub.defaultDateOption;
              }
              if (
                sub.operationRule &&
                typeof sub.operationRule === "object" &&
                sub.operationRule.leftOperand &&
                sub.operationRule.rightOperand &&
                ["+", "-", "*", "/"].includes(sub.operationRule.operator)
              ) {
                base.operationRule = {
                  leftOperand: sub.operationRule.leftOperand,
                  operator: sub.operationRule.operator,
                  rightOperand: sub.operationRule.rightOperand,
                };
              }
            }

            return base;
          });
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
