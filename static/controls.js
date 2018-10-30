var createControls = function(controlObj) {
  // var obj = {
  //   radius: {
        //  type: 'number', 'boolean'
  //     value: 0,
  //     max: 200,
  //     min: 0,
  //    onChange: () => {}
  //   }
  // };
  var controls = new function () {
    var me = this;
    Object.keys(controlObj).map(function(key) {
      me[key] = controlObj[key].value;
    })
    this.redraw = function (cb, e) {
      if (cb) cb(controls, e);
    };
  }

  var changes = function(key, obj) {
    switch (obj.type) {
      case 'number':
        gui.add(controls, key, obj.min, obj.max).name(obj.name).onChange(function() {
          controls.redraw(obj.onChange);
        });
        break;
      case 'boolean':
        gui.add(controls, key).name(obj.name).onChange(function() {
          controls.redraw(obj.onChange);
        });
        break;
      case 'color':
        gui.addColor(controls, key).name(obj.name).onChange(function (e) {
          controls.redraw(obj.onChange, e);
        });
      case 'select':
        gui.add(controls, key, obj.data).name(obj.name).onChange(function (e) {
          controls.redraw(obj.onChange, e);
        }); 
        break;
      default:
        break;
    }
  }

  var gui = new dat.GUI();
  Object.keys(controlObj).map(function(key) {
    changes(key, controlObj[key]);
  })
}
