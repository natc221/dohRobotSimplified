/**
 * Methods that provide more convenient use of the DOH Robot.
 */

function RobotDOH(robot, keys) {
	//relevant delays and speeds that can be adjusted
	this.speed =  0.8; //0.5 for double the speed, under 0.3 will cause errors
	this.allDelays = 80 * this.speed;
	this.mouseMoveSpeed = 150 * this.speed;
	this.typeSpeed = 80 * this.speed; //per key

	//height in pixels of each dropdown option, 
	//this affects how far the mouse moves relative to the top option
	this.dropTextHeight = 19;
	
	//Helper function to click mouse at current mouse position
	this.click = function() {
		robot.mouseClick({left:true}, this.allDelays);
	};
	
	/*
	 * Helper function to click item.
	 * Offset is based on the top left corner of the DOMNode, where top left
	 * is (0,0)
	 */
	this.clickAt = function(/*DOMNode || String*/ dom, x, y) {
		this.moveTo(dom, x, y);
		this.click();
	};

	/*
	 * Helper function to move mouse to a DOM element, with or without an offset.
	 * If no offset, then mouse will move to the center of the DOM node (default
	 * action of DOH robot)
	 * Offset is based on the top left corner of the DOMNode, where top left
	 * is (0,0)
	 */
	this.moveTo = function(/*DOMNode || String*/ dom, x, y) {
		//if offset exists
		if (x && y) {
			robot.mouseMoveAt(dom, 1, this.mouseMoveSpeed, x, y);
		}
		else {
			robot.mouseMoveAt(dom, 1, this.mouseMoveSpeed);
		}
	};
	
	/*
	 * Changes value in a textbox
	 * 
	 * valueTo: value to be typed into
	 * id: id of textbox
	 */
	this.changeTextbox =  function(/*String*/ valueTo, /*String*/ id) {
		if (typeof id == "string") {
			if (typeof valueTo == "string") {
				robot.mouseMoveAt(id, 1, this.mouseMoveSpeed);
				robot.mouseClick({left:true}, this.allDelays);
				
				var textLength = 
					robot.doc.getElementById(id).value.length;
				
				//delete value in textbox
				for (var i = 0; i < textLength; i++) {
					robot.keyPress(keys.BACKSPACE, this.typeSpeed);
				}
				//type new value into textbox
				robot.typeKeys(valueTo, 200, this.typeSpeed * valueTo.length);
				robot.mouseMoveAt(id, this.allDelays, this.mouseMoveSpeed, -10, 10);
				robot.mouseClick({left:true}, 50);
			}
			else {
				console.error("robotFunctions.changeTextbox: valueTo must be a string");
			}
		}
		else {
			console.error("robotFunctions.changeTextbox: id must be a string.");
			console.error("Use changeTextboxDOM() if DOM of textbox is used");
		}
			
	};

	/*
	 * Changes value in a textbox, but DOM node is given to the function
	 * 
	 * valueTo: value to be typed into
	 * node: DOM node of textbox
	 */
	this.changeTextboxDOM = function(/*String*/ valueTo, /*DOMNode*/ node) {
		if (node) {
			if (typeof valueTo == "string") {
				robot.mouseMoveAt(node, 1, this.mouseMoveSpeed);
				robot.mouseClick({left:true}, this.allDelays);
				
				var textLength = node.value.length;
				
				//delete value in textbox
				for (var i = 0; i < textLength; i++) {
					robot.keyPress(keys.BACKSPACE, this.typeSpeed);
				}
				//type new value into textbox
				robot.typeKeys(valueTo, 200, this.typeSpeed * valueTo.length);
				robot.mouseMoveAt(node, this.allDelays, this.mouseMoveSpeed, -10, 10);
				robot.mouseClick({left:true}, 50);
			}
			else {
				console.error("robotFunctions.changeTextbox: valueTo must be a string");
			}
		}
		else {
			console.error("textbox is falsey");
			console.error("textbox given:\n" + textbox);
		}
	};


	/*
	 * Selects an item in the dropdown.
	 * dropdown: DOMNode of dropdown
	 * toSelect: index number of the item to be selected, 0 is the top element
	 */
	this.selectDropdown = function(/*DOMNode*/ dropdown, /*Integer*/ toSelect, textHeight) {
		if (dropdown) {
			var children = dropdown.childElementCount;

			if (toSelect < children) {
				var h = dropdown.clientHeight + 2,
				w = dropdown.clientWidth;

				moveTo(dropdown);
				this.click();

				//move to item in list
				this.moveTo(dropdown, w / 2, h + (textHeight * toSelect)); 
				this.click();

				//workaround for click not working if last robot action
				robot.mouseMoveAt(dropdown, 10, this.mouseMoveSpeed);
			}
			else {
				robot.sequence(function() {
					console.error("Dropdown " + dropdown.name 
							+ ", children no.: " + children 
							+ ", attempted index: " + toSelect
							+ " (max index " + (children - 1) + ")");
				});
			}
		}
		else {
			console.error("dropdown is falsey");
			console.error("dropdown given:\n" + dropdown);
		}
	};


	/*
	 * Click through all options in a dropdown.
	 * 
	 * **NOTE** this does not have proper testing, as currently, it checks
	 * if the index clicked is the index selected after clicking
	 */
	this.clickAllOptions = function(/*DOMNode*/ dropdown) {
		var d = new doh.Deferred();
		var check = true;

		//to avoid dropdown from going up if at bottom of viewport
		robot.mouseWheel(3, 1, 50);

		var j = 0; //to track supposed index
		for (var i = 0; i < dropdown.childElementCount; i++) {
			this.selectDropdown(dropdown, i, this.dropTextHeight);
			robot.sequence(function() {
				check = check && (j === dropdown.selectedIndex);
				j++;
			});
		}
		robot.sequence(d.getTestCallback(function() {
			doh.t(check, "not all dropdown items selected properly");
		}));
		return d;
	};

	
	/* 
	 * Helper method to check if slider value and corresponding
	 * textbox value match up
	 * 
	 * TODO: implement for textbox argument to be DOMNode
	 */
	var checkSliderTextbox = function(value, textbox) {
		if (typeof textbox == "string") {
			inBox = robot.doc.getElementById(textbox).value;
		}
		//retrieve DOMNode
		else if (typeof textbox == "function"){
			inBox = textbox().value;
		}
		inBox = inBox.replace(',','');
		return value == parseInt(inBox);
	};

	/*
	 * Checks the boundaries of a slider, and if its behaviour is
	 * as expected. Checks if the value of slider corresponds to value in
	 * associated textbox
	 */
	this.sliderBoundsTest = function(slider, textbox) {
		var d = new doh.Deferred();
		var check = true;
		
		//move to min
		robot.mouseMoveAt(slider.focusNode, this.allDelays, this.mouseMoveSpeed);
		robot.mousePress({left:true}, 100);
		robot.mouseMoveAt(slider.domNode, this.allDelays, this.mouseMoveSpeed, -4, 0);
		
		//check values
		robot.sequence(function() {
			console.log(slider.value);
			check = check && (slider.value == slider.minimum);	
			check = check && checkSliderTextbox(slider.value, textbox);
		}, this.allDelays);
		
		//move to max
		robot.mouseMoveAt(slider.domNode, this.allDelays, this.mouseMoveSpeed,
				slider.domNode.clientWidth + 4, 0);
		
		//check values
		robot.sequence(function() {
			console.log(slider.value);
			check = check && (slider.value == slider.maximum);
			check = check && checkSliderTextbox(slider.value, textbox);
		}, this.allDelays);
		
		//move to below min
		robot.mouseMoveAt(slider.domNode, this.allDelays, this.mouseMoveSpeed,
				-50, 0);
		
		//check values
		robot.sequence(function() {
			console.log(slider.value);
			check = check && (slider.value == slider.minimum);
			check = check && checkSliderTextbox(slider.value, textbox);
		}, this.allDelays);
		
		//move to above max
		robot.mouseMoveAt(slider.domNode,this.allDelays, this.mouseMoveSpeed,
				slider.domNode.clientWidth + 50, 0);
		
		//check values
		robot.sequence(function() {
			console.log(slider.value);
			check = check && (slider.value == slider.maximum);
			check = check && checkSliderTextbox(slider.value, textbox);
		}, this.allDelays);
		
		//move to below min
		robot.mouseMoveAt(slider.domNode, this.allDelays, this.mouseMoveSpeed,
				-300, 0);
		
		//check values
		robot.sequence(function() {
			console.log(slider.value);
			check = check && (slider.value == slider.minimum);
			check = check && checkSliderTextbox(slider.value, textbox);
		}, this.allDelays);
		
		//move to above max
		//x-offset cannot be too great, browser boundary on right
		robot.mouseMoveAt(slider.domNode, this.allDelays, this.mouseMoveSpeed,
				slider.domNode.clientWidth + 70, 0); 
		
		//check values
		robot.sequence(function() {
			console.log(slider.value);
			check = check && (slider.value == slider.maximum);
			check = check && checkSliderTextbox(slider.value, textbox);
		}, this.allDelays + 50); //slightly longer delay
		
		robot.mouseRelease({left:true}, this.allDelays);
		
		robot.sequence(d.getTestCallback(function() {
			doh.t(check, "slider boundaries should be max and min, " +
					"and textbox value corresponding");
		}));
		return d;
	};
	
	/*
	 * Changes slider to a specified amount
	 */
	this.moveSlider = function(moveTo, sliderID) {
		
		//get slider from registry of dijits
		var registry = robot.window.require("dijit/registry");
		var slider = registry.byId(sliderID);
		
		//check if value in boundaries
		if (moveTo < slider.minimum || moveTo > slider.maximum) {
			console.error("moveTo is not within the boundaries of the slider");
		}
		
		else {
			robot.mouseMoveAt(slider.focusNode, _allDelays, _mouseMoveSpeed, 0, 0);
			robot.mousePress({left:true}, 100);
			
			//calculate the offset in pixels to move the slider
			var ratio = moveTo / slider.maximum;
			var xPos = (slider.domNode.clientWidth-2) * ratio;
			
			robot.mouseMoveAt(slider.domNode, 
					this.allDelays, this.mouseMoveSpeed,
					xPos, (slider.domNode.clientHeight / 2));
			robot.mouseRelease({left:true}, 100);
		}
	};
	
	/*
	 * Creates a list of tests to be registered with the DOH robot
	 * data: object with the data to be entered and verified with
	 */
	this.createTests = function(/*Object*/ data, /*String*/ attribute,
			/*Function*/ enterFunction, /*String || Function*/ idOrDOM, /*Function*/ verifyResults) {
		var tests = [];
		for (var i in data) {
			var x = {
				name: i.toString(),
				timeout: 8000,
				data: data[i],
				runTest: function() {
					if (typeof idOrDOM == "function") {
						enterFunction(this.data[attribute], idOrDOM());
					}
					else if (typeof idOrDOM == "string") {
						enterFunction(this.data[attribute], idOrDOM);
					}
					else {
						console.error("Only string IDs or function to " +
								"retrieve DOMNode accepted");
					}
					return verifyResults(this.data);
				}
			};
			tests.push(x);
		}
		return tests;
	};
	
};

