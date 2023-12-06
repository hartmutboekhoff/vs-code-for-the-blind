const {view, selectors} = require('../GenericString');

exports.view = view;
exports.selectors = [
  ...selectors,
  {
    SchemaPath: undefined,
    SchemaType: undefined,
    DataType: {
      value:'string',
      priority: 3,
    },
    EditorType: undefined
  }
];

