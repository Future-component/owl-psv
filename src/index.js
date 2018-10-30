/**
 * owlPSV
 * 1.0.0
 * Copyright (c) 2018-09-13 13:54:20 Beth
 * 实现全景播放的插件
 * depend [three.js, sphoords.js, stats.js, tween.js]
 */

 /**
	[+]360全景展示（人眼）
	[-]小行星展示
	[-]球体展示
	[-]鱼眼展示
	[+]陀螺仪
	[+]手势识别
	[+]VR识别
	[+]全景切换
	[+]几何物体添加
	[+]锚点添加
	[-]模型导入
	[+]stat.js FPS检测
	[+]物体位置检测
	[+]依赖的工具库
	[+]添加事件监听
	[+]音频导入
  [-]WS链接-事件监听
	[]场景事件的穿透点击
	[]场景的切换动画
  */

/* eslint-disable */
(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
      (global.owlPSV = factory())
})(this, function() {
  'use strict';

	var Version = '1.0.0';
	var Sphoords = window.Sphoords;
	var THREE = window.THREE;
	var Stats = window.Stats;

	// 定义全局变量
	var sphoords = new Sphoords();
	
	/**
	 * Detects whether canvas is supported.
	 * @private
	 * @return {boolean} `true` if canvas is supported, `false` otherwise
	 **/

	var isCanvasSupported = function() {
		var canvas = document.createElement('canvas');
		return !!(canvas.getContext && canvas.getContext('2d'));
	};

	/**
	 * Detects whether WebGL is supported.
	 * @private
	 * @return {boolean} `true` if WebGL is supported, `false` otherwise
	 **/

	var isWebGLSupported = function() {
		var canvas = document.createElement('canvas');
		return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
	};

	/**
	 * Attaches an event handler function to an element.
	 * @private
	 * @param {HTMLElement} elt - The element
	 * @param {string} evt - The event name
	 * @param {function} f - The handler function
	 * @return {void}
	 **/

	var addEvent = function(elt, evt, f) {
		if (!!elt.addEventListener)
			elt.addEventListener(evt, f, false);
		else
			elt.attachEvent('on' + evt, f);
	};

	/**
	 * Ensures that a number is in a given interval.
	 * @private
	 * @param {number} x - The number to check
	 * @param {number} min - First endpoint
	 * @param {number} max - Second endpoint
	 * @return {number} The checked number
	 **/

	var stayBetween = function(x, min, max) {
		return Math.max(min, Math.min(max, x));
	};

	/**
	 * Calculates the distance between two points (square of the distance is enough).
	 * @private
	 * @param {number} x1 - First point horizontal coordinate
	 * @param {number} y1 - First point vertical coordinate
	 * @param {number} x2 - Second point horizontal coordinate
	 * @param {number} y2 - Second point vertical coordinate
	 * @return {number} Square of the wanted distance
	 **/

	var dist = function(x1, y1, x2, y2) {
		var x = x2 - x1;
		var y = y2 - y1;
		return x*x + y*y;
	};

	var PSVRotateViewer = function(psv) {
		var rotateEle = document.createElement('div');
		rotateEle.setAttribute('class', 'rotate-viewer');

		var rotateViewer = `
			<div style="background-color: rgba(0, 0, 0, 0.7); border-radius: 100%; height: 25px; margin-top: -20px; padding: 5px; position: absolute; right: 20px; top: 50%; width: 25px; cursor: pointer; pointer-events: initial; opacity: 0.5; display: inline-block; transition: opacity 0.3s ease 0s;">
				<div style="cursor: pointer; border-radius: 50%; width: 26px; height: 26px; border: 2px solid rgb(255, 255, 255); position: relative;   margin-top: -3px; margin-left: -3px;">
					<div style="width: 0px; height: 0px; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 6px solid rgb(255, 255, 255); position: absolute; left: 5px; top: -6px;"></div>
					<div style="width: 4px; height: 4px; background-color: rgb(255, 255, 255); border: 2px solid rgba(0, 0, 0, 0.7); border-radius: 50%; margin-top: -4px; margin-left: -4px; position: absolute; left: 50%; top: 50%; z-index: 2;"></div>
					<div id="rotateViewer" style="border-radius: 50%; width: 24px; height: 24px; margin-top: -12px; margin-left: -12px; left: 50%; top: 50%; position: absolute; background-color: rgb(255, 255, 255); z-index: 1; transform: rotate(0deg);">
						<div style="border-radius: 50%; width: 24px; height: 24px; margin-top: -12px; margin-left: -12px; left: 50%; top: 50%; position: absolute; background-color: rgb(0, 0, 0); z-index: 1; clip: rect(0px, 12px, 24px, 0px); transform: rotate(-23.0722deg);"></div>
						<div style="border-radius: 50%; width: 24px; height: 24px; margin-top: -12px; margin-left: -12px; left: 50%; top: 50%; position: absolute; background-color: rgb(0, 0, 0); z-index: 1; clip: rect(0px, 12px, 24px, 0px); transform: rotate(203.072deg);"></div>
					</div>
				</div>
			</div>
		`;

		this.create = function() {
			// rotateViewer HTML: HTMLElement 
			rotateEle.innerHTML = rotateViewer;
		}

		this.getViewer = function() {
			return rotateEle;
		};

		this.updateProgress = function(angle) {
			var rotateViewer = document.getElementById('rotateViewer');
			rotateViewer.style.transform = `rotate(${angle}deg)`;
		}

		this.show = function() {
			var ele = document.querySelector('.rotate-viewer');
			if (ele) {
				ele.style.display = 'block';
			}
		}

		this.hide = function() {
			var ele = document.querySelector('.rotate-viewer');
			if (ele) {
				ele.style.display = 'none';
			}
		}
	}
  
	function initStats() {
		var stats = new Stats();
		stats.setMode(0); // 0: fps, 1: ms

		// Align top-left
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.left = '0px';
		stats.domElement.style.top = '0px';

		var statsOutput = document.getElementById('Stats-output');
		if (statsOutput) {
			statsOutput.append(stats.domElement);
			statsOutput.style.display = 'none';
		} else {
			statsOutput = document.createElement('div');
			statsOutput.setAttribute('id', 'Stats-output');
			statsOutput.append(stats.domElement);
			statsOutput.style.display = 'none';
			document.body.append(statsOutput);	
		}

		return stats;
	}

  function owlPSV(args) {
		/******* owlPSV 依赖工具方法 *********/

		/**
		 * Parses an animation speed.
		 * @private
		 * @param {string} speed - The speed, in radians/degrees/revolutions per second/minute
		 * @return {number} The speed in radians
		 **/

		var parseAnimationSpeed = function(speed) {
			speed = speed.toString().trim();

			// Speed extraction
			var speed_value = parseFloat(speed.replace(/^(-?[0-9]+(?:\.[0-9]*)?).*$/, '$1'));
			var speed_unit = speed.replace(/^-?[0-9]+(?:\.[0-9]*)?(.*)$/, '$1').trim();

			// "per minute" -> "per second"
			if (speed_unit.match(/(pm|per minute)$/))
				speed_value /= 60;

			var rad_per_second = 0;

			// Which unit?
			switch (speed_unit) {
				// Revolutions per minute / second
				case 'rpm':
				case 'rev per minute':
				case 'revolutions per minute':
				case 'rps':
				case 'rev per second':
				case 'revolutions per second':
					// speed * 2pi
					rad_per_second = speed_value * 2 * Math.PI;
					break;

				// Degrees per minute / second
				case 'dpm':
				case 'deg per minute':
				case 'degrees per minute':
				case 'dps':
				case 'deg per second':
				case 'degrees per second':
					// Degrees to radians (rad = deg * pi / 180)
					rad_per_second = speed_value * Math.PI / 180;
					break;

				// Radians per minute / second
				case 'rad per minute':
				case 'radians per minute':
				case 'rad per second':
				case 'radians per second':
					rad_per_second = speed_value;
					break;

				// Unknown unit
				default:
					// m_anim = false;
			}

			// Longitude offset
			return rad_per_second * PSV_ANIM_TIMEOUT / 1000;
		};

		/**
		 * Parses an angle given in radians or degrees.
		 * @private
		 * @param {number|string} angle - Angle in radians (number) or in degrees (string)
		 * @return {number} The angle in radians
		 **/

		var parseAngle = function(angle) {
			// console.log('parseAngle', angle)
			angle = angle.toString().trim();

			// Angle extraction
			var angle_value = parseFloat(angle.replace(/^(-?[0-9]+(?:\.[0-9]*)?).*$/, '$1'));
			var angle_unit = angle.replace(/^-?[0-9]+(?:\.[0-9]*)?(.*)$/, '$1').trim();

			// Degrees
			if (angle_unit == 'deg')
				angle_value *= Math.PI / 180;

			// Radians by default, we don't have anyting to do
			return getAngleMeasure(angle_value);
		};

		/**
		 * Returns the measure of an angle (between 0 and 2π).
		 * @private
		 * @param {number} angle - The angle to reduce
		 * @param {boolean} [is_2pi_allowed=false] - Can the measure be equal to 2π?
		 * @return {number} The wanted measure
		 **/

		var getAngleMeasure = function(angle, is_2pi_allowed) {
			// console.log('getAngleMeasure', angle, is_2pi_allowed)
			is_2pi_allowed = (is_2pi_allowed !== undefined) ? !!is_2pi_allowed : false;
			return (is_2pi_allowed && angle == 2 * Math.PI) ? 2 * Math.PI : angle - Math.floor(angle / (2.0 * Math.PI)) * 2.0 * Math.PI;
		};

		/**
		 * Sets the viewer size.
		 * @private
		 * @param {object} size - An object containing the wanted width and height
		 * @return {void}
		 **/

		var setNewViewerSize = function(size) {
			// Checks all the values
			for (var dim in size) {
				// Only width and height matter
				if (dim == 'width' || dim == 'height') {
					// Size extraction
					var size_str = size[dim].toString().trim();

					var size_value = parseFloat(size_str.replace(/^([0-9]+(?:\.[0-9]*)?).*$/, '$1'));
					var size_unit = size_str.replace(/^[0-9]+(?:\.[0-9]*)?(.*)$/, '$1').trim();

					// Only percentages and pixels are allowed
					if (size_unit !== '%')
						size_unit = 'px';

					// We're good
					new_viewer_size[dim] = {
							css: size_value + size_unit,
							unit: size_unit
						};
				}
			}
		};

		/**
		 * Adds a function to execute when a given action occurs.
		 * @public
		 * @param {string} name - The action name
		 * @param {function} f - The handler function
		 * @return {void}
		 **/

		var addAction = function(name, f) {
			// New action?
			if (!(name in actions))
				actions[name] = [];

			actions[name].push(f);
		};

		/**
		 * Triggers an action.
		 * @private
		 * @param {string} name - Action name
		 * @param {*} arg - An argument to send to the handler functions
		 * @return {void}
		 **/

		var triggerAction = function(name, arg) {
			// Does the action have any function?
			if ((name in actions) && !!actions[name].length) {
				for (var i = 0, l = actions[name].length; i < l; ++i) {
					if (arg !== undefined)
						actions[name][i](arg);

					else
						actions[name][i]();
				}
			}
		};

		/**
		 * Detects whether fullscreen is enabled or not.
		 * @private
		 * @return {boolean} `true` if fullscreen is enabled, `false` otherwise
		 **/

		var isFullscreenEnabled = function() {
			return (!!document.fullscreenElement || !!document.mozFullScreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement);
		};

		/**
		 * Enables fullscreen.
		 * @private
		 * @return {void}
		 **/

		var enableFullscreen = function() {
			if (!!container.requestFullscreen)
				container.requestFullscreen();

			else if (!!container.mozRequestFullScreen)
				container.mozRequestFullScreen();

			else if (!!container.webkitRequestFullscreen)
				container.webkitRequestFullscreen();

			else if (!!container.msRequestFullscreen)
				container.msRequestFullscreen();
		};

		/**
		 * Disables fullscreen.
		 * @private
		 * @return {void}
		 **/

		var disableFullscreen = function() {
			if (!!document.exitFullscreen)
				document.exitFullscreen();

			else if (!!document.mozCancelFullScreen)
				document.mozCancelFullScreen();

			else if (!!document.webkitExitFullscreen)
				document.webkitExitFullscreen();

			else if (!!document.msExitFullscreen)
				document.msExitFullscreen();
		};

		/**
		 * Enables/disables fullscreen.
		 * @public
		 * @return {void}
		 **/

		var toggleFullscreen = function() {
			// Switches to fullscreen mode
			if (!isFullscreenEnabled())
				enableFullscreen();

			// Switches to windowed mode
			else
				disableFullscreen();
    };
    
    this.version = Version;

		/**
		 * Resizes the canvas.
		 * @private
		 * @param {object} size - New dimensions
		 * @param {number} [size.width] - The new canvas width (default to previous width)
		 * @param {number} [size.height] - The new canvas height (default to previous height)
		 * @return {void}
		 **/

		var resize = function(size) {
			// console.log('resize', size)
			viewer_size.width = (size.width !== undefined) ? parseInt(size.width) : viewer_size.width;
			viewer_size.height = (size.height !== undefined) ? parseInt(size.height) : viewer_size.height;
			viewer_size.ratio = viewer_size.width / viewer_size.height;

			if (!!camera) {
				camera.aspect = viewer_size.ratio;
				camera.updateProjectionMatrix();
			}

			if (!!renderer) {
				renderer.setSize(viewer_size.width, viewer_size.height);
				render('renderer');
			}

			if (!!stereo_effect) {
				stereo_effect.setSize(viewer_size.width, viewer_size.height);
				render('stereo_effect');
			}
		};

		/**
		 * Returns the current position in radians弧度
		 * @return {object} A longitude/latitude couple
		 **/

		var getPosition = function() {
			return {
				longitude: long,
				latitude: lat
			};
		};

		/**
		 * Returns the current position in degrees角度
		 * @return {object} A longitude/latitude couple
		 **/

		var getPositionInDegrees = function() {
			return {
				longitude: long * 180.0 / Math.PI,
				latitude: lat * 180.0 / Math.PI
			};
		};

		/**
		 * Moves to a specific position
		 * @private
		 * @param {number|string} longitude - The longitude of the targeted point
		 * @param {number|string} latitude - The latitude of the targeted point
		 * @return {void}
		 **/

		var moveTo = function(longitude, latitude) {
			var long_tmp = parseAngle(longitude);

			if (!whole_circle)
				long_tmp = stayBetween(long_tmp, PSV_MIN_LONGITUDE, PSV_MAX_LONGITUDE);

			var lat_tmp = parseAngle(latitude);

			if (lat_tmp > Math.PI)
				lat_tmp -= 2 * Math.PI;

			lat_tmp = stayBetween(lat_tmp, PSV_TILT_DOWN_MAX, PSV_TILT_UP_MAX);

			long = long_tmp;
			lat = lat_tmp;

			/**
			 * Indicates that the position has been modified.
			 * @callback owlPSV~onPositionUpdateed
			 * @param {object} position - The new position
			 * @param {number} position.longitude - The longitude in radians
			 * @param {number} position.latitude - The latitude in radians
			 **/

			triggerAction('position-updated', {
				longitude: long,
				latitude: lat
			});

			render('moveTo');
		};

		/**
		 * Rotates the view
		 * @private
		 * @param {number|string} dlong - The rotation to apply horizontally
		 * @param {number|string} dlat - The rotation to apply vertically
		 * @return {void}
		 **/

		var rotate = function(dlong, dlat) {
			dlong = parseAngle(dlong);
			dlat = parseAngle(dlat);

			moveTo(long + dlong, lat + dlat);
		};

		/**
		 * Attaches or detaches the keyboard events
		 * @private
		 * @param {boolean} attach - `true` to attach the event, `false` to detach it
		 * @return {void}
		 **/

		var toggleArrowKeys = function(attach) {
			var action = (attach) ? window.addEventListener : window.removeEventListener;
			action('keydown', keyDown);
		};

		/**
		 * Tries to standardize the code sent by a keyboard event
		 * @private
		 * @param {KeyboardEvent} evt - The event
		 * @return {string} The code
		 **/

		var retrieveKey = function(evt) {
			// The Holy Grail
			if (evt.key) {
				var key = (/^Arrow/.test(evt.key)) ? evt.key : 'Arrow' + evt.key;
				return key;
			}

			// Deprecated but still used
			if (evt.keyCode || evt.which) {
				var key_code = (evt.keyCode) ? evt.keyCode : evt.which;

				var keycodes_map = {
					38: 'ArrowUp',
					39: 'ArrowRight',
					40: 'ArrowDown',
					37: 'ArrowLeft'
				};

				if (keycodes_map[key_code] !== undefined)
					return keycodes_map[key_code];
			}

			// :/
			return '';
		};

		/**
		 * Rotates the view through keyboard arrows
		 * @private
		 * @param {KeyboardEvent} evt - The event
		 * @return {void}
		 **/

		var keyDown = function(evt) {
			var dlong = 0, dlat = 0;

			switch (retrieveKey(evt)) {
				case 'ArrowUp':
					dlat = PSV_KEYBOARD_LAT_OFFSET;
					break;

				case 'ArrowRight':
					dlong = -PSV_KEYBOARD_LONG_OFFSET;
					break;

				case 'ArrowDown':
					dlat = -PSV_KEYBOARD_LAT_OFFSET;
					break;

				case 'ArrowLeft':
					dlong = PSV_KEYBOARD_LONG_OFFSET;
					break;
			}

			rotate(dlong, dlat);
		};

		var changeCursor = function(type) {
			var container = document.getElementById('container');
			switch(type) {
				case 'mouseDown':
				case 'touchStart':
				case 'mouseMove':
				case 'touchMove':
					container.style.cursor = 'move';
					break;
				case 'mouseUp':
				case 'up':
				case 'move':
					container.style.cursor = 'pointer';
					break;
			}
		}

		/**
		 * The user wants to move.
		 * @private
		 * @param {Event} evt - The event
		 * @return {void}
		 **/

		var onMouseDown = function(evt) {
			startMove(parseInt(evt.clientX), parseInt(evt.clientY));
		};

		/**
		 * The user wants to move or to zoom (mobile version).
		 * @private
		 * @param {Event} evt - The event
		 * @return {void}
		 **/

		var onTouchStart = function(evt) {
			// console.log('onTouchStart', evt)
			// Move
			if (evt.touches.length == 1) {
				var touch = evt.touches[0];
				if (touch.target.parentNode == canvas_container)
					startMove(parseInt(touch.clientX), parseInt(touch.clientY));
			}

			// Zoom
			// else if (evt.touches.length == 2) {
			// 	onMouseUp();

			// 	if (evt.touches[0].target.parentNode == canvas_container && evt.touches[1].target.parentNode == canvas_container)
			// 		startTouchZoom(dist(evt.touches[0].clientX, evt.touches[0].clientY, evt.touches[1].clientX, evt.touches[1].clientY));
			// }

			// Show navigation bar if hidden
			objectToolsShow();
		};

		/**
		 * Initializes the movement.
		 * @private
		 * @param {integer} x - Horizontal coordinate
		 * @param {integer} y - Vertical coordinate
		 * @return {void}
		 **/

		var startMove = function(x, y) {
			// Store the current position of the mouse
			mouse_x = x;
			mouse_y = y;

			// Start the movement
			mousedown = true;
		};

		/**
		 * Initializes the "pinch to zoom" action.
		 * @private
		 * @param {number} d - Square of the distance between the two fingers
		 * @return {void}
		 **/

		var startTouchZoom = function(d) {
			touchzoom_dist = d;

			touchzoom = true;
		};

		/**
		 * The user wants to stop moving (or stop zooming with their finger).
		 * @private
		 * @param {Event} evt - The event
		 * @return {void}
		 **/

		var onMouseUp = function(evt) {
			mousedown = false;
			touchzoom = false;
		};

		/**
		 * The user moves the image.
		 * @private
		 * @param {Event} evt - The event
		 * @return {void}
		 **/

		var onMouseMove = function(evt) {
			evt.preventDefault();
			move(parseInt(evt.clientX), parseInt(evt.clientY));
		};

		/**
		 * The user moves the image (mobile version).
		 * @private
		 * @param {Event} evt - The event
		 * @return {void}
		 **/

		var onTouchMove = function(evt) {
			// Move
			if (evt.touches.length == 1 && mousedown) {
				var touch = evt.touches[0];
				if (touch.target.parentNode == canvas_container) {
					evt.preventDefault();
					move(parseInt(touch.clientX), parseInt(touch.clientY));
				}
			}

			// Zoom
			else if (evt.touches.length == 2) {
				if (evt.touches[0].target.parentNode == canvas_container && evt.touches[1].target.parentNode == canvas_container && touchzoom) {
					evt.preventDefault();

					// Calculate the new level of zoom
					var d = dist(evt.touches[0].clientX, evt.touches[0].clientY, evt.touches[1].clientX, evt.touches[1].clientY);
					var diff = d - touchzoom_dist;

					if (diff !== 0) {
						var direction = diff / Math.abs(diff);
						zoom(zoom_lvl + direction * zoom_speed);

						touchzoom_dist = d;
					}
				}
			}
		};

		/**
		 * Movement.
		 * @private
		 * @param {integer} x - Horizontal coordinate
		 * @param {integer} y - Vertical coordinate
		 * @return {void}
		 **/

		var move = function(x, y) {
			changeCursor('move');
			if (mousedown) {
				// Smooth movement
				if (smooth_user_moves) {
					long += (x - mouse_x) / viewer_size.height * fov * Math.PI / 180;
					lat += (y - mouse_y) / viewer_size.height * fov * Math.PI / 180;
				}

				// No smooth movement
				else {
					long += (x - mouse_x) * PSV_LONG_OFFSET;
					lat += (y - mouse_y) * PSV_LAT_OFFSET;
				}

				// Save the current coordinates for the next movement
				mouse_x = x;
				mouse_y = y;

				// Coordinates treatments
				if (!whole_circle)
					long = stayBetween(long, PSV_MIN_LONGITUDE, PSV_MAX_LONGITUDE);

				long = getAngleMeasure(long, true);

				lat = stayBetween(lat, PSV_TILT_DOWN_MAX, PSV_TILT_UP_MAX);

				triggerAction('position-updated', {
					longitude: long,
					latitude: lat
				});

				render('move');
				rotateViewer.updateProgress(long * 100)
			}
		};

		/**
		 * Starts following the device orientation.
		 * 开启屏幕方向旋转修改
		 * @private
		 * @return {void}
		 **/

		var startDeviceOrientation = function() {
			sphoords.start();
			stopAutorotate();

			/**
			 * Indicates that we starts/stops following the device orientation.
			 * @callback owlPSV~onDeviceOrientationStateChanged
			 * @param {boolean} state - `true` if device orientation is followed, `false` otherwise
			 **/

			triggerAction('device-orientation', true);
		};

		/**
		 * Stops following the device orientation.
		 * @private
		 * @return {void}
		 **/

		var stopDeviceOrientation = function() {
			sphoords.stop();

			triggerAction('device-orientation', false);
		};

		/**
		 * Starts/stops following the device orientation.
		 * @public
		 * @return {void}
		 **/

		var toggleDeviceOrientation = function(value) {
			if (sphoords.isEventAttached() && !value)
				stopDeviceOrientation();

			else if (value)
				startDeviceOrientation();
		};

		/**
		* The user moved their device.
		* @private
		* @param {object} coords - The spherical coordinates to look at
		* @param {number} coords.longitude - The longitude
		* @param {number} coords.latitude - The latitude
		* @return {void}
		**/

		var onDeviceOrientation = function(coords) {
			console.log('coords', coords)
			long = stayBetween(coords.longitude, PSV_MIN_LONGITUDE, PSV_MAX_LONGITUDE);
			lat = stayBetween(coords.latitude, PSV_TILT_DOWN_MAX, PSV_TILT_UP_MAX);

			triggerAction('position-updated', {
				longitude: long,
				latitude: lat
			});

			render();
		};

		/**
		 * The user wants to zoom.
		 * @private
		 * @param {Event} evt - The event
		 * @return {void}
		 **/

		var onMouseWheel = function(evt) {
			evt.preventDefault();
			evt.stopPropagation();

			var delta = (evt.detail) ? -evt.detail : evt.wheelDelta;

			if (delta !== 0) {
				// var direction = parseInt(delta / Math.abs(delta));
				// zoom(zoom_lvl + direction * zoom_speed);
			}
		};

		/**
		 * Sets the new zoom level.
		 * @private
		 * @param {integer} level - New zoom level
		 * @return {void}
		 **/

		var zoom = function(level) {
      zoom_lvl = stayBetween(level, 20, 60);
      selfPsv.zoom_lvl = zoom_lvl;
			fov = PSV_FOV_MAX + (zoom_lvl / 100) * (PSV_FOV_MIN - PSV_FOV_MAX);

			camera.fov = fov;
			camera.updateProjectionMatrix();
			render('zoom');

			/**
			 * Indicates that the zoom level has changed.
			 * @callback owlPSV~onZoomUpdated
			 * @param {number} zoom_level - The new zoom level
			 **/

			triggerAction('zoom-updated', zoom_lvl);
		};

		/**
		 * Zoom in.
		 * @public
		 * @return {void}
		 **/

		var zoomIn = function() {
			if (zoom_lvl < 60)
				zoom(zoom_lvl + zoom_speed);
		};

		/**
		 * Zoom out.
		 * @public
		 * @return {void}
		 **/

		var zoomOut = function() {
			// if (zoom_lvl > 0)
				zoom(zoom_lvl - zoom_speed);
		};

		/**
		 * Detects whether fullscreen is enabled or not.
		 * @private
		 * @return {boolean} `true` if fullscreen is enabled, `false` otherwise
		 **/

		var isFullscreenEnabled = function() {
			return (!!document.fullscreenElement || !!document.mozFullScreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement);
		};

		/**
		 * Fullscreen state has changed.
		 * @private
		 * @return {void}
		 **/

		var fullscreenToggled = function() {
			// Fix the (weird and ugly) Chrome and IE behaviors
			if (!!document.webkitFullscreenElement || !!document.msFullscreenElement) {
				real_viewer_size.width = container.style.width;
				real_viewer_size.height = container.style.height;

				container.style.width = '100%';
				container.style.height = '100%';
				fitToContainer();
			}

			else if (!!container.webkitRequestFullscreen || !!container.msRequestFullscreen) {
				container.style.width = real_viewer_size.width;
				container.style.height = real_viewer_size.height;
				fitToContainer();
			}

			/**
			 * Indicates that the fullscreen mode has been toggled.
			 * @callback owlPSV~onFullscreenToggled
			 * @param {boolean} enabled - `true` if fullscreen is enabled, `false` otherwise
			 **/

			triggerAction('fullscreen-mode', isFullscreenEnabled());
		};

		// Required parameters
		if (args === undefined || args.panoramas === undefined || args.container === undefined) {
			console.log('owlPSV: no value given for panorama or container');
			return;
		}

		// Should the movement be smooth?
		var smooth_user_moves = (args.smooth_user_moves !== undefined) ? !!args.smooth_user_moves : true;

		// Movement speed
		var PSV_LONG_OFFSET = (args.long_offset !== undefined) ? parseAngle(args.long_offset) : Math.PI / 360.0;
		var PSV_LAT_OFFSET = (args.lat_offset !== undefined) ? parseAngle(args.lat_offset) : Math.PI / 180.0;

		var PSV_KEYBOARD_LONG_OFFSET = (args.keyboard_long_offset !== undefined) ? parseAngle(args.keyboard_long_offset) : Math.PI / 60.0;
		var PSV_KEYBOARD_LAT_OFFSET = (args.keyboard_lat_offset !== undefined) ? parseAngle(args.keyboard_lat_offset) : Math.PI / 120.0;

		// Minimum and maximum fields of view in degrees
		var PSV_FOV_MIN = (args.min_fov !== undefined) ? stayBetween(parseFloat(args.min_fov), 1, 179) : 30;
		var PSV_FOV_MAX = (args.max_fov !== undefined) ? stayBetween(parseFloat(args.max_fov), 1, 179) : 90;

		// Minimum tilt up / down angles
		var PSV_TILT_UP_MAX = (args.tilt_up_max !== undefined) ? stayBetween(parseAngle(args.tilt_up_max), 0, Math.PI / 2.0) : Math.PI / 2.0;
		var PSV_TILT_DOWN_MAX = (args.tilt_down_max !== undefined) ? -stayBetween(parseAngle(args.tilt_down_max), 0, Math.PI / 2.0) : -Math.PI / 2.0;

		// Minimum and maximum visible longitudes
		var min_long = (args.min_longitude !== undefined) ? parseAngle(args.min_longitude) : 0;
		var max_long = (args.max_longitude !== undefined) ? parseAngle(args.max_longitude) : 0;
		var whole_circle = (min_long == max_long);
	
		if (whole_circle) {
			min_long = 0;
			max_long = 2 * Math.PI;
		}
	
		else if (max_long === 0)
			max_long = 2 * Math.PI;

		var PSV_MIN_LONGITUDE, PSV_MAX_LONGITUDE;
		if (min_long < max_long) {
			PSV_MIN_LONGITUDE = min_long;
			PSV_MAX_LONGITUDE = max_long;
		}

		else {
			PSV_MIN_LONGITUDE = max_long;
			PSV_MAX_LONGITUDE = min_long;
		}

		// Default position
		var lat = 0, long = PSV_MIN_LONGITUDE;
		
		if (args.default_position !== undefined) {
			if (args.default_position.lat !== undefined) {
				var lat_angle = parseAngle(args.default_position.lat);
				if (lat_angle > Math.PI)
					lat_angle -= 2 * Math.PI;
	
				lat = stayBetween(lat_angle, PSV_TILT_DOWN_MAX, PSV_TILT_UP_MAX);
			}
	
			if (args.default_position.long !== undefined)
				long = stayBetween(parseAngle(args.default_position.long), PSV_MIN_LONGITUDE, PSV_MAX_LONGITUDE);
		}

		// Sphere heightSegments and widthSegments
		var heightSegments = (args.heightSegments !== undefined) ? parseInt(args.heightSegments) : 100;
		var widthSegments = (args.widthSegments !== undefined) ? parseInt(args.widthSegments) : 100;

		// Default zoom level
    var zoom_lvl = this.zoom_lvl = 0;
    var selfPsv = this;

		if (args.zoom_level !== undefined) {
      zoom_lvl = stayBetween(parseInt(Math.round(args.zoom_level)), 0, 100);
      this.zoom_lvl = zoom_lvl
    }

		var fov = PSV_FOV_MAX + (zoom_lvl / 100) * (PSV_FOV_MIN - PSV_FOV_MAX);

		// Animation constants
		var PSV_FRAMES_PER_SECOND = 60;
		var PSV_ANIM_TIMEOUT = 1000 / PSV_FRAMES_PER_SECOND;

		// Horizontal animation speed
		var anim_long_offset = (args.anim_speed !== undefined) ? parseAnimationSpeed(args.anim_speed) : parseAnimationSpeed('2rpm');

		// Reverse the horizontal animation if autorotate reaches the min/max longitude
		var reverse_anim = true;

		if (args.reverse_anim !== undefined)
			reverse_anim = !!args.reverse_anim;

		// Vertical animation speed
		var anim_lat_offset = (args.vertical_anim_speed !== undefined) ? parseAnimationSpeed(args.vertical_anim_speed) : parseAnimationSpeed('2rpm');

		// Vertical animation target (default: equator)
		var anim_lat_target = 0;

		if (args.vertical_anim_target !== undefined) {
			var lat_target_angle = parseAngle(args.vertical_anim_target);
			if (lat_target_angle > Math.PI)
				lat_target_angle -= 2 * Math.PI;

			anim_lat_target = stayBetween(lat_target_angle, PSV_TILT_DOWN_MAX, PSV_TILT_UP_MAX);
		}

		// Navigation bar
		var rotateViewer = new PSVRotateViewer(this);

		// Must we display the navigation bar?
		var display_rotateviewer = true;

		// Are user interactions allowed?
		var user_interactions_allowed = (args.allow_user_interactions !== undefined) ? !!args.allow_user_interactions : true;

		// if (!user_interactions_allowed)
		// 	display_navbar = false;

		// User's zoom speed
		var zoom_speed = (args.zoom_speed !== undefined) ? parseFloat(args.zoom_speed) : 20;

		// Eyes offset in VR mode
		var eyes_offset = (args.eyes_offset !== undefined) ? parseFloat(args.eyes_offset) : 5;

		// Container (ID to retrieve?)
		var container = (typeof args.container == 'string') ? document.getElementById(args.container) : args.container;

		// Size of the viewer
		var viewer_size, new_viewer_size = {}, real_viewer_size = {};
		if (args.size !== undefined)
			setNewViewerSize(args.size);

		// Some useful attributes
		var canvasData = args.data;
		var panoramas = args.panoramas;
		var images = args.images;
		var globalImages = [];
		var textures = [];
		var imgWrap = [];
		var panoramaIndex = 0;
		var audiosData = args.audios || {};
		var clickEggCallback = args.clickEggCallback;
		var progress = args.progress;

		// 初始化容器
		var root;
		var canvas_container;

		// 初始化three相关对象
		var renderer = null;
		var scene = null;
		var camera = null;
		var stat = initStats();

		var stereo_effect = null;
		var mousedown = false;
		var mouse_x = 0;
		var mouse_y = 0;
		var touchzoom = false;
		var touchzoom_dist = 0;

		// var autorotate_timeout = null;
		// var anim_timeout = null;

		var actions = {};

		// Can we use CORS?
		var cors_anonymous = (args.cors_anonymous !== undefined) ? !!args.cors_anonymous : true;

		// Cropped size?
		var pano_size = {
			full_width: null,
			full_height: null,
			cropped_width: null,
			cropped_height: null,
			cropped_x: null,
			cropped_y: null
		};

		// The user defines the real size of the panorama
		if (args.pano_size !== undefined) {
			for (var attr in pano_size) {
				if (args.pano_size[attr] !== undefined)
					pano_size[attr] = parseInt(args.pano_size[attr]);
			}
		}

		// Captured FOVs
		var captured_view = {
			horizontal_fov: 360,
			vertical_fov: 180
		};

		if (args.captured_view !== undefined) {
			for (var attr in captured_view) {
				if (args.captured_view[attr] !== undefined)
					captured_view[attr] = parseFloat(args.captured_view[attr]);
			}
		}

		// Will we have to recalculate the coordinates?
		var recalculate_coords = false;

		// Loading image
		// var loading_img = (args.loading_img !== undefined) ? args.loading_img.toString() : null;

		// Function to call once panorama is ready?
		// var self = this;
		if (args.onready !== undefined)
			addAction('ready', args.onready);

		// Go?
		// var autoload = (args.autoload !== undefined) ? !!args.autoload : true;

		var getPanoSize = function(img) {
			// Must the pano size be changed?
			var default_pano_size = {
				full_width: img.width,
				full_height: img.height,
				cropped_width: img.width,
				cropped_height: img.height,
				cropped_x: null,
				cropped_y: null
			};

			// Captured view?
			if (captured_view.horizontal_fov !== 360 || captured_view.vertical_fov !== 180) {
				// The indicated view is the cropped panorama
				pano_size.cropped_width = default_pano_size.cropped_width;
				pano_size.cropped_height = default_pano_size.cropped_height;
				pano_size.full_width = default_pano_size.full_width;
				pano_size.full_height = default_pano_size.full_height;

				// Horizontal FOV indicated
				if (captured_view.horizontal_fov !== 360) {
					var rh = captured_view.horizontal_fov / 360.0;
					pano_size.full_width = pano_size.cropped_width / rh;
				}

				// Vertical FOV indicated
				if (captured_view.vertical_fov !== 180) {
					var rv = captured_view.vertical_fov / 180.0;
					pano_size.full_height = pano_size.cropped_height / rv;
				}
			}

			else {
				// Cropped panorama: dimensions defined by the user
				for (var attr in pano_size) {
					if (pano_size[attr] === null && default_pano_size[attr] !== undefined)
						pano_size[attr] = default_pano_size[attr];
				}

				// Do we have to recalculate the coordinates?
				if (recalculate_coords) {
					if (pano_size.cropped_width !== default_pano_size.cropped_width) {
						var rx = default_pano_size.cropped_width / pano_size.cropped_width;
						pano_size.cropped_width = default_pano_size.cropped_width;
						pano_size.full_width *= rx;
						pano_size.cropped_x *= rx;
					}

					if (pano_size.cropped_height !== default_pano_size.cropped_height) {
						var ry = default_pano_size.cropped_height / pano_size.cropped_height;
						pano_size.cropped_height = default_pano_size.cropped_height;
						pano_size.full_height *= ry;
						pano_size.cropped_y *= ry;
					}
				}
			}

			// Middle if cropped_x/y is null
			if (pano_size.cropped_x === null)
				pano_size.cropped_x = (pano_size.full_width - pano_size.cropped_width) / 2;

			if (pano_size.cropped_y === null)
				pano_size.cropped_y = (pano_size.full_height - pano_size.cropped_height) / 2;

			// Size limit for mobile compatibility
			var max_width = 2048;
			if (isWebGLSupported()) {
				var canvas_tmp = document.createElement('canvas');
				var ctx_tmp = canvas_tmp.getContext('webgl');
				max_width = ctx_tmp.getParameter(ctx_tmp.MAX_TEXTURE_SIZE);
			}

			// Buffer width (not too big)
			var new_width = Math.min(pano_size.full_width, max_width);
			var r = new_width / pano_size.full_width;

			pano_size.full_width = new_width;
			pano_size.cropped_width *= r;
			pano_size.cropped_x *= r;
			

			// Buffer height (proportional to the width)
			pano_size.full_height *= r;
			pano_size.cropped_height *= r;
			pano_size.cropped_y *= r;

			return pano_size;
		}

		/**
		 * Creates an image in the right dimensions.
		 * @private
		 * @return {void}
		 **/

		var createBuffer = function(panorama) {
			return new Promise(function(resolve, reject) {
				var img = new Image();
				img.onload = function() {
					var pano_size = getPanoSize(img);
	
					img.width = pano_size.cropped_width;
					img.height = pano_size.cropped_height;

					// Buffer creation
					var buffer = document.createElement('canvas');

					buffer.width = pano_size.full_width;
					buffer.height = pano_size.full_height;
	
					var ctx = buffer.getContext('2d');
					ctx.drawImage(img, pano_size.cropped_x, pano_size.cropped_y, pano_size.cropped_width, pano_size.cropped_height);
					resolve(buffer.toDataURL('image/jpeg'));
				};

				img.onerror = function(err) {
					console.log('2图片太大了，加载失败，刷新页面试试！');
				}
	
				// CORS when the panorama is not given as a base64 string
				if (cors_anonymous && panorama && !panorama.match(/^data:image\/[a-z]+;base64/)) {
					img.setAttribute('crossOrigin', 'anonymous');
				}
				img.src = panorama;
			})
		}

		/**
		 * Loads the sphere texture.
		 * @private
		 * @param {string} path - Path to the panorama
		 * @return {void}
		 **/
		var loadTexture = function(path, cb) {
			var texture = new THREE.Texture();
			var loader = new THREE.ImageLoader();

			var onLoad = function(img) {
				texture.needsUpdate = true;
				texture.image = img;
				texture.transparent = true;

				if (cb && typeof cb === 'function') {
					cb(texture);
				} else if (cb && typeof cb === 'number') {
					textures[cb] = texture;
				}	
			};

			loader.load(path, onLoad);
		}

		var init = function() {
			// Is canvas supported?
			if (!isCanvasSupported()) {
				container.textContent = 'Canvas is not supported, update your browser!';
				return;
			}

			// Is Three.js loaded?
			if (window.THREE === undefined) {
				console.log('owlPSV: Three.js is not loaded.');
				return;
			}

			// Adds a new container
			root = document.createElement('div');
			root.style.width = '100%';
			root.style.height = '100%';
			root.style.position = 'relative';
			root.style.overflow = 'hidden';

			// Current viewer size
			viewer_size = {
				width: 0,
				height: 0,
				ratio: 0
			};

			threeStart(textures[panoramaIndex]);
		};

		var threeStart = function(texture, font) {
			progress('创建渲染器');
			initThree();
			progress('创建3D场景');
			initScene();
			progress('添加相机');
			initCamera();
			progress('添加场景');
			initPanorama(texture);
			progress('场景渲染');
			initRender(initTween);
		}

		var canvasStyle = `
			position: absolute;
			z-index: 0;
			width: 100%;
			height: 100vh;
		`;

		var canvasSceneStyle = `
			position: absolute;
			-webkit-transition: all 0.5s ease-in;
			transition: all 0.5s ease-in;
			// transform: scale(0);
			opacity: 0;
		`;

		var initThree = function() {
			// New size?
			if (new_viewer_size.width !== undefined)
				container.style.width = new_viewer_size.width.css;

			if (new_viewer_size.height !== undefined)
				container.style.height = new_viewer_size.height.css;

			fitToContainer();

			// 创建渲染器
			// The chosen renderer depends on whether WebGL is supported or not
			renderer = (isWebGLSupported()) ? new THREE.WebGLRenderer({
				antialias: true,
			}) : new THREE.CanvasRenderer();
			renderer.setSize(viewer_size.width, viewer_size.height);
			
			// Canvas container
			canvas_container = document.getElementById('canvasContainer');
			if (!canvas_container) {
				canvas_container = document.createElement('div');
				canvas_container.setAttribute('id', 'canvasContainer');
				canvas_container.style = canvasStyle;
				root.appendChild(canvas_container);

				initPanoramaTools();

			  initEvent();

				// First render
				container.innerHTML = '';
				container.appendChild(root);
			}

			// canvas_container.innerHTML = '';
			renderer.domElement.setAttribute('id', 'canvasScene');
			renderer.domElement.setAttribute('class', 'canvas-scene');
			renderer.domElement.style = canvasSceneStyle;
			canvas_container.appendChild(renderer.domElement);
			renderer.setClearColor(0x000000, 1.0);
		}

		var initPanoramaTools = function() {
			if (display_rotateviewer) {
				rotateViewer.create();
				document.body.appendChild(rotateViewer.getViewer());
			}
		}

		var initEvent = function() {
			// Adding events
			addEvent(window, 'resize', fitToContainer);

			if (user_interactions_allowed) {
				addEvent(canvas_container, 'mousedown', onMouseDown);
				addEvent(canvas_container, 'mousemove', onMouseMove);
				addEvent(canvas_container, 'mousemove', objectToolsShow);
				addEvent(canvas_container, 'mouseup', onMouseUp);
				
				// addEvent(canvas_container, 'mousewheel', onMouseWheel);
				// addEvent(canvas_container, 'DOMMouseScroll', onMouseWheel);
				
				addEvent(canvas_container, 'touchstart', onTouchStart);
				addEvent(canvas_container, 'touchend', onMouseUp);
				addEvent(canvas_container, 'touchmove', onTouchMove);

				// self.addAction('fullscreen-mode', toggleArrowKeys);
			}

			addEvent(canvas_container, 'fullscreenchange', fullscreenToggled);
			addEvent(canvas_container, 'mozfullscreenchange', fullscreenToggled);
			addEvent(canvas_container, 'webkitfullscreenchange', fullscreenToggled);
			addEvent(canvas_container, 'MSFullscreenChange', fullscreenToggled);

			sphoords.addListener(onDeviceOrientation);
		}

		var initScene = function() {
			// 创建场景
			scene = new THREE.Scene();
		}
		
		var initCamera = function() {
			// Camera
			camera = new THREE.PerspectiveCamera(PSV_FOV_MAX, viewer_size.ratio, 1, 300);
			// camera = new THREE.PerspectiveCamera(PSV_FOV_MAX, window.innerWidth / window.innerHeight, 1, 300);
			camera.position.set(0, 0, 0);
			// camera.position.set(0, 0, 200);
			scene.add(camera);
		}

		// 初始化全局背景音乐
		function initAudio(audioUrl, play) {
			// var sound = null;
			// if (!sound && play) {
			// 	var listener = new THREE.AudioListener();
			// 	sound = new THREE.Audio(listener);
			// 	sound.load(audioUrl);
			// }	
			// this.play = function() {
			// 	if (sound) {
			// 		sound.play();
			// 	}
			// };
			// this.pause = function() {
			// 	if (!sound) {
			// 		sound.pause();
			// 	}
			// }
		}

    var plane = null;
		var initVideo = function() {
      //添加立方体
      var geometry = new THREE.PlaneGeometry( 40, 30 );

      //获取到video对象
      var video = document.querySelector("#my_video_1");
      //通过video对象实例化纹理
      var texture = new THREE.VideoTexture(video);
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      var material = new THREE.MeshBasicMaterial( { map: texture } );
      plane = new THREE.Mesh(geometry, material);
      plane.position.set(0, 0, -40);
      scene.add(plane);
    }
    
		var controlMusic = function(play) {
			if (play) {
				initAudio(audiosData.main, true)
			}	else {
				initAudio(audiosData.main, true)
			}
    }
    
    var controlVideo = function(pause) {
      var video = document.querySelector("#my_video_1");
      if (!video.ended && pause) {
        video.pause();

      } else if (!video.isPlaying && !pause) {
        video.play();
      }
		}

    var closeVideo = function() {
			scene.remove(plane);
			render();
    }

		var removeObject = function(id, index){
			// var allChildren = scene.children;
			var obj = scene.getObjectById(id);
			if(
				obj instanceof THREE.Sprite ||
				obj instanceof THREE.Mesh
			){
				console.log('删除对象ID:', id, index, objects)
				objects.splice(index, 1);
				eleAnnies.splice(index, 1);
				scene.remove(obj);
		  }
		}

		var mesh = null;
		var material = null;
		var objects = [];
		var geometry = null;
		var sphere = null;
		var initPanorama = function(texture) {
			// Sphere
			geometry = new THREE.SphereGeometry(100, widthSegments, heightSegments, 2 * Math.PI, 2 * Math.PI);
			material = new THREE.MeshBasicMaterial({
				color: 0x666666,
				map: texture,
				side: THREE.DoubleSide,
				transparent: true,
				wireframe: true,
			});
			sphere = new THREE.Mesh( geometry, material );
			sphere.scale.x = -1;
			scene.add(sphere);
		}

		var createSpriteText = function(data){
			if (!data || !data.name) return null;
			//先用画布将文字画出
			let canvas = document.createElement("canvas");
			let ctx = canvas.getContext("2d");
			ctx.fillStyle = "#000000";
			ctx.font = 'Bold 60px 微软雅黑';
			ctx.lineWidth = 6;
			ctx.fillText(data.name, 20, 70);
			let texture = new THREE.Texture(canvas);
			texture.needsUpdate = true;

			//使用Sprite显示文字
			let material = new THREE.SpriteMaterial({map:texture});
			let mesh = new THREE.Sprite(material);
			mesh.scale.set(20, 10, 1.0);
			mesh.position.x = data.x;
			mesh.position.y = data.y + 10;
			mesh.position.z = data.z;
			mesh.name = data.name;
			mesh.objId = data.id;
			mesh.type = 'text';
			scene.add(mesh);
			objects.push(mesh);
		}

		var createSpriteImage = function(eleAnnie, texture, data, type, scale) {
			if (!data) return null;
			console.log(data, type);

			scale = scale || {};
			var material = new THREE.SpriteMaterial({
				map: texture,
				useScreenCoordinates: true,
				transparent: true,
			});
			mesh = new THREE.Sprite(material);
			mesh.scale.x = scale.x || 30;
			mesh.scale.y = scale.y || 30;
			mesh.scale.z = scale.z || 1.0;

			mesh.position.x = data.x;
			mesh.position.y = data.y;
			mesh.position.z = data.z;
			mesh.name = data.name;
			mesh.goTo = data.goTo;
			mesh.objId = data.id;
			mesh.currentIndex = objects.length;
			mesh.type = type;
			scene.add(mesh);
			objects.push(mesh);
			eleAnnies.push(eleAnnie);
		}

		var eleAnnies = [];
		var initElement = function() {
			var currentData = canvasData[panoramaIndex];
			console.log(currentData, panoramaIndex);
			if (currentData && currentData.spots) {
				Object.keys(currentData.spots).forEach(function(key, index) {
					var runnerTexture1 = globalImages[0];
					if (!runnerTexture1) {
						loadTexture(images[0].img, function(texture) {
							runnerTexture1 = globalImages[0] = texture;
							createSpriteImage(
								new TileTextureAnimator(texture, images[0].num, 1, 0.05),
								texture,
								currentData.spots[key],
								'clickSpot',
								index,
						  );
						});
					} else {
						createSpriteImage(
							new TileTextureAnimator(runnerTexture1, images[0].num, 1, 0.05),
							runnerTexture1,
							currentData.spots[key],
							'clickSpot',
							index,
						);	
					}
					createSpriteText(currentData.spots[key]);
				})
			}

			if (currentData && currentData.eggs) {
				Object.keys(currentData.eggs).forEach(function(key, index) {
					var idx = index % 4 + 1;
					var runnerTexture2 = globalImages[idx];
					if (!runnerTexture2) {
						loadTexture(images[idx].img, function(texture) {
							runnerTexture2 = globalImages[idx] = texture;
							createSpriteImage(
								new TileTextureAnimator(texture, images[idx].num, 1, 0.2),
								texture,
								{ ...currentData.eggs[key], name: idx * 100 },
								images[idx].red ? 'clickEgg' : 'click',
							);
						});	
					} else {
						createSpriteImage(
							new TileTextureAnimator(runnerTexture2, images[idx].num, 1, 0.2),
							runnerTexture2,
							{ ...currentData.eggs[key], name: idx * 100 },
							images[idx].red ? 'clickEgg' : 'click',
						);
					}
				})
			}
			
			createSpriteText();
		}

		var rotateSphereTween = function() {
			return new Promise(function(resolve) {
				var x = 0;
				var timer = setInterval(function() {
					long = getAngleMeasure(long + 0.1, true);
					triggerAction('position-updated', {
						longitude: long,
						latitude: lat
					});
					x += 1;
					zoom(x);
					render();

					if (x > 40) {
						clearInterval(timer);
						timer = null;
						stop();
						resolve();
					}
				}, 1000 / 60);
			})
    }

		var changeLong = function(val) {
			long = val;
			triggerAction('position-updated', {
				longitude: long,
				latitude: lat
			});

			render();
		}

		var rotateSphereTween1 = function() {
			return new Promise(function(resolve) {
				createTween(
					{ x: lat, y: long, z: 66 },
					{ x: 0, y: 4.8, z: 255 },
					1000,
					function(obj, stop) {
						var rgb = Math.floor(obj.z);
						var color = new THREE.Color(`rgb(${rgb}, ${rgb}, ${rgb})`);
						material.color = color;

						long = obj.y;
						lat = obj.x;
						triggerAction('position-updated', {
							longitude: long,
							latitude: lat
						});

						render();
						
						if (!obj.x) {
							stop();
							resolve();
						}
					},
				)
			})
		}

		var initTween = function() {
			rotateSphereTween().then(function() {
				return rotateSphereTween1();
			}).then(function() {
				console.log('动画结束');
				initElement();
				initClick();
				render();

				// controlMusic(true);
				toggleAuto(true);

				material.wireframe = false;
				if (args.anim_complated) {
          args.anim_complated();
        };
			});
		}

		var objectEvent = function(type, object) {
			console.log('-objectEvent-', name, object, object.goTo)
			if (!object.id) {
				return null;
			}
			switch (type) {
				case 'click':
					// var audio = new initAudio(audiosData.zan, true);
					// audio.play();
					// console.log(audio);
					break;
				case 'clickEgg':
					initAudio(audiosData.egg, true);
					clickEggCallback(object);
					createEgg(object);
					break;
				case 'clickSpot':
					if (typeof object.goTo !== 'undefined') {
						updatePanorama(object.goTo)
					}
					break;
				case 'egg-c':
					initAudio(audiosData.zan, true);
					break;
				default:
					break;
			}	
		}

		var createEgg = function(object) {
			// 删除当前的，在当前位置创建一个新的
			if (object) {
				var data = {
					x: object.position.x,
					y: object.position.y,
					z: object.position.z,
					name: 500,
					id: object.objId,
					currentIndex: object.currentIndex,
					type: 'egg-c',
				};
				removeObject(object.id, object.currentIndex);

				var idx = 5;
				var runnerTexture2 = globalImages[idx];
				if (!runnerTexture2) {
					loadTexture(images[idx].img, function(texture) {
						runnerTexture2 = globalImages[idx] = texture;
						createSpriteImage(
							new TileTextureAnimator(texture, images[idx].num, 1, 0.2),
							texture,
							data,
							'egg-c',
						);
					});	
				} else {
					createSpriteImage(
						new TileTextureAnimator(runnerTexture2, images[idx].num, 1, 0.2),
						runnerTexture2,
						data,
						'egg-c',
					);
				}
				render();
			}
		}

		function onDocumentMouseDown(event) {
			var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
			vector = vector.unproject(camera);
			var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
			var intersects = raycaster.intersectObjects(objects, true);
			if (intersects.length > 0) {
					// console.log("wow, it worked", intersects, objects, scene.children);
					objectEvent(intersects[0].object.type, intersects[0].object);
			}
		}

		var initClick = function() {
			container.addEventListener('mousedown', onDocumentMouseDown, false);
		}
		var removeClick = function() {
			container.removeEventListener('mousedown', onDocumentMouseDown, false);	
		}

		var initRender = function(cb) {
			render('create-scene');

			// Zoom?
			if (zoom_lvl > 0)
				zoom(zoom_lvl);

			/**
			 * Indicates that the loading is finished: the first image is rendered
			 * @callback owlPSV~onReady
			 **/

			triggerAction('ready');

			console.log('加载完成')
			var canvasScene = document.querySelector('.canvas-scene');
			canvasScene.style.opacity = '1';

			if (cb) cb();
		}

		/**
		* Renders an image.
		* @private
		* @return {void}
		**/
		var point = null;
		// update controls and stats
		var clock = new THREE.Clock();
		var render = function(source_msg) {
			// console.log('render:', source_msg)

			// return null;
      point = new THREE.Vector3();
      // 改变相机的观察角度
			// long 转动的角度计算的三维坐标
			point.setX(Math.cos(lat) * Math.sin(long));
			point.setY(Math.sin(lat));
			point.setZ(Math.cos(lat) * Math.cos(long));
			camera.lookAt(point);

			update();	

			// Stereo?
			if (stereo_effect !== null) {
				stereo_effect.render(scene, camera);
			} else {
				renderer.render(scene, camera);
			}

			stat.update();
		};

		// update controls and stats
		var clock = new THREE.Clock();
		function update() {
			var delta = clock.getDelta();
		
			if (eleAnnies && eleAnnies.length) {
				for (var i = 0; i < eleAnnies.length; i++) {
					eleAnnies[i].update(delta);
				}
			}
		}

		/**
		 * Starts the stereo effect.
		 * 开启webVR双屏效果
		 * @private
		 * @return {void}
		 **/

		var startStereo = function() {
			// console.log('startStereo');
			stereo_effect = new THREE.StereoEffect(renderer);
			stereo_effect.eyeSeparation = eyes_offset;
			stereo_effect.setSize(viewer_size.width, viewer_size.height);

			startDeviceOrientation();
			enableFullscreen();
			objectToolsHide();	
			
			render('startStereo');

			/**
			 * Indicates that the stereo effect has been toggled.
			 * @callback owlPSV~onStereoEffectToggled
			 * @param {boolean} enabled - `true` if stereo effect is enabled, `false` otherwise
			 **/

			triggerAction('stereo-effect', true);
		};

		/**
		 * Stops the stereo effect.
		 * @private
		 * @return {void}
		 **/

		var stopStereo = function() {
			// console.log('stopStereo')
			stereo_effect = null;
			renderer.setSize(viewer_size.width, viewer_size.height);

			objectToolsHide(false);
			
			render('stopStereo');

			triggerAction('stereo-effect', false);
		};

    var animateFrame = {
      animateFrameInstance: null,
      animateFrameVersion: 0,
			start: function(cb, loop) {
        // console.log('start', loop, animateFrame.animateFrameInstance)
        if (!loop && animateFrame.animateFrameInstance) {
          // console.log('start-stop')
          animateFrame.stop();
        }

        animateFrame.animateFrameInstance = requestAnimationFrame(function() {
          animateFrame.start(cb, loop || 'loop');
        });

        animateFrame.animateFrameVersion += 1;
        if (cb) {
          cb();
        }
				render();
			},
			stop: function() {
        // console.log('stop', animateFrame.animateFrameInstance);
        // console.log('stop-version', animateFrame.animateFrameVersion);
				if (animateFrame.animateFrameInstance) {
					window.cancelAnimationFrame(animateFrame.animateFrameInstance)
          animateFrame.animateFrameInstance = null;
          animateFrame.animateFrameVersion = 0;
				}
			},
			toggle: function() {
				if (animateFrame.animateFrameInstance) {
					animateFrame.stop();
				} else {
					animateFrame.start();
				}
			}
		}

    var createTween = function(orginObj, targetObj, delay, callback) {
      var tween = new TWEEN.Tween(orginObj);
			tween.to(targetObj, delay);
			tween.start();
			animate();
      
      function animate() {
        animateFrame.start(TWEEN.update);
      }
	
      tween.onUpdate(function() {
				callback(this, function() {
					animateFrame.stop();
					tween.stop();
					tween = null;
				});
			});
    }
  
		var toggleStereo = function(value) {
			if (stereo_effect !== null && !value) {
				stopStereo();
				animateFrame.stop();
			} else if (value) {
				startStereo();
				animateFrame.start();
			}
		};

		function TileTextureAnimator(texture, hTiles, vTiles, durationTile) {

			// current tile number
			this.currentTile = 0;
		
			// duration of every tile
			this.durationTile = durationTile;
		
			// internal time counter
			this.currentTime = 0;
		
			// amount of horizontal and vertical tiles, and total count of tiles
			this.hTiles = hTiles;
			this.vTiles = vTiles;
			this.cntTiles = this.hTiles * this.vTiles;
		
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
			texture.repeat.set(1 / this.hTiles, 1 / this.vTiles);
			texture.transparent = true;
		
			this.update = function(time) {
				this.currentTime += time;
		
				while (this.currentTime > this.durationTile) {
					this.currentTime -= this.durationTile;
					this.currentTile++;
		
					if (this.currentTile == this.cntTiles) {
						this.currentTile = 0;
					}
		
					var iColumn = this.currentTile % this.hTiles;
					texture.offset.x = iColumn / this.hTiles;
					var iRow = Math.floor(this.currentTile / this.hTiles);
					texture.offset.y = iRow / this.vTiles;
					texture.transparent = true;
				}
			};
		}

		/**
		* Automatically rotates the panorama.
		* @private
		* @return {void}
		**/

		var autorotate = function(noloop) {
			lat -= (lat - anim_lat_target) * anim_lat_offset;
			long += anim_long_offset;

			if (!whole_circle) {
				long = stayBetween(long, PSV_MIN_LONGITUDE, PSV_MAX_LONGITUDE);

				if (long == PSV_MIN_LONGITUDE || long == PSV_MAX_LONGITUDE) {
					// Must we reverse the animation or simply stop it?
					if (reverse_anim)
						anim_long_offset *= -1;
				}
			}

			long = getAngleMeasure(long, true);

			triggerAction('position-updated', {
				longitude: long,
				latitude: lat
			});

			render('autorotate');
			rotateViewer.updateProgress(long * 100)
		};

		/**
		 * Starts the autorotate animation.
		 * @private
		 * @return {void}
		 **/

		var startAutorotate = function() {
      animateFrame.start(autorotate);
			triggerAction('autorotate', true);
		};

		/**
		 * Stops the autorotate animation.
		 * @private
		 * @return {void}
		 **/

		var stopAutorotate = function() {
      animateFrame.stop();
			triggerAction('autorotate', false);
		};

		/**
		 * Launches/stops the autorotate animation.
		 * @public
		 * @return {void}
		 **/

		var toggleAutorotate = function(auto) {
      if (auto) {
        startAutorotate();
      } else {
        stopAutorotate();
      }
		};

		var toggleAuto = function(auto) {
			if (auto) {
				animateFrame.start();
			} else {
				animateFrame.stop();
			}
		}

		var clearCurrentScene = function(preIndex) {
			var currentData = canvasData[preIndex];
			var allChildren = scene.children;

			if (currentData) {
				for (var i = allChildren.length - 1; i >= 0; i--) {
					var objId = allChildren[i].objId;
					if (objId) {
						if (
							allChildren[i].type === 'click' ||
							allChildren[i].type === 'clickEgg' ||
							allChildren[i].type === 'egg-c'
						) {
							if (currentData.eggs && currentData.eggs[objId]) {
								removeObject(allChildren[i].id)
							}
						} else if (
							allChildren[i].type === 'clickSpot' ||
							allChildren[i].type === 'text'
						) {
							if (currentData.spots && currentData.spots[objId]) {
								removeObject(allChildren[i].id)
							}
						}
					}
				}
			}
		}

		var updatePanoramaScene = function(texture) {
			material.map = texture;
			var canvasScene = document.querySelector('.canvas-scene');
			canvasScene.style.opacity = '1';

			zoom(4 * 10);
			changeLong(4.8);
			initElement();
			initClick();
			
			progress(0);
			toggleAuto(true);
		}

		var updatePanoramaAnimate = function() {
			createTween(
				{ x: 4 },
				{ x: 20 },
				1000,
				function(obj, stop) {
					zoom(obj.x * 10);
					if (obj.x === 20 && textures[panoramaIndex]) {
						stop();
						updatePanoramaScene(textures[panoramaIndex]);
					}	
				},
			)
		}

		var updatePanorama = function(index) {
			stopAutorotate();
			if (index === panoramaIndex) {
				return null;
			}

			var canvasScene = document.querySelector('.canvas-scene');
			canvasScene.style.opacity = '0.2';
			progress('场景加载');
			removeClick();

			// removeObject
			var preIndex = panoramaIndex || 0;
			clearCurrentScene(preIndex);

			panoramaIndex = index;

			if (textures[panoramaIndex]) {
				updatePanoramaAnimate();
			} else {
				createBuffer(panoramas[panoramaIndex]).then(function(path) {
					panoramas[panoramaIndex] = path;
					return new Promise(function(resolve) {
						loadTexture(path, resolve)
					});
				}).then(function(texture) {
					textures[panoramaIndex] = texture;
					updatePanoramaAnimate();
				});	
			}
		}

		/**
		 * Resizes the canvas to make it fit the container.
		 * @private
		 * @return {void}
		 **/

		var fitToContainer = function() {
			// console.log('fitToContainer')
			if (container.clientWidth !== viewer_size.width || container.clientHeight !== viewer_size.height) {
				resize({
					width: container.clientWidth,
					height: container.clientHeight
				});
			}
		};

		var objectToolsHide = function(state) {
      rotateViewer.hide();
			if (args.stereoClose) args.stereoClose();
			// var statsOutput = document.getElementById('Stats-output');
			// statsOutput.style.display = 'none';
		}

		var objectToolsShow = function() {
      rotateViewer.show();
			if (args.stereoOpen) args.stereoOpen(); 
			// var statsOutput = document.getElementById('Stats-output');
			// statsOutput.style.display = 'block';
		}

		var changeColor = function(color) {
			var color1 = new THREE.Color(color);
			material.color = color1;
			render();
		}

		var changeMode = function(z) {
			createTween(
				{ x: z ? 0 : 200 },
				{ x: z },
				1000,
				function(obj, stop) {
					camera.position.z = obj.x;
					render();

					if (obj.x === z) {
						stop();	
					}
				}
			)	
		}
		
		var loaderImage = function() {
			return new Promise(function(resolve) {
				progress('场景加载');

				createBuffer(panoramas[0]).then(function(path) {
					panoramas[0] = path;
					return new Promise(function(resolve) {
						loadTexture(path, resolve)
					});
				}).then(function(texture) {
					textures[0] = texture;
					resolve('images load success!')
				});	
			})
		}

		// 需要导出的API
		this.animateFrame = animateFrame;
		this.createTween = createTween;
		this.objectToolsHide = objectToolsHide;
		this.objectToolsShow = objectToolsShow;

		this.controlMusic = controlMusic;
		this.initVideo = initVideo;
		this.controlVideo = controlVideo;
		this.closeVideo = closeVideo;

		this.changeColor = changeColor;
		this.changeMode = changeMode;	
		this.changeLong = changeLong

		// 对外暴露的接口
		this.zoomOut = zoomOut;
		var getZoomLevel = this.getZoomLevel = zoom_lvl;
		this.zoom = zoom;
		this.zoomIn = zoomIn;
		this.toggleFullscreen = toggleFullscreen;
    this.toggleAutorotate = toggleAutorotate;
    this.toggleAuto = toggleAuto;
		this.updatePanorama = updatePanorama;
		this.mouseWheel = onMouseWheel;
		this.toggleStereo = toggleStereo;
		this.toggleDeviceOrientation = toggleDeviceOrientation;
		this.addAction = addAction;

		// 放到这里，就能自动监听屏幕变化？
		this.fitToContainer = fitToContainer;
		this.init = init;

		this.loaderImage = loaderImage;
		return this;
	}

  var owlPSV$1 = owlPSV;
  
  return owlPSV$1;
})
