#D.O.H Robot Simplified
----

Provide more convenient and efficient usage of using Dojo Objective Harness Robot for testing a basic web page.

####Required files/folders:
- dojo/robot.js
- dojo/robotx.js
- util (doh)

These can be downloaded from the Dojo github: https://github.com/dojo

DOH Robot API: http://dojotoolkit.org/api/ *(see dojo/robot, dojo/robotx)*

DOH Robot Documentation: http://dojotoolkit.org/reference-guide/1.10/util/dohrobot.html

DOH documentation: http://dojotoolkit.org/reference-guide/1.10/util/doh.html

##Running the Tests

The flow of the release of tests are:
**runner.html -> module.js -> releaseTests.html -> tests.js**

```releaseTests.html``` loads ```tests.js``` which is where the test cases are written. 
 A group of tests can be registered to be a module, then the module is registred in ```module.js```.
 
 ```runner.html``` is included in the DOH package, more details below.


####Execute Tests (runner.html)
Using the DOH Test runner, the test modules in module.js (included examples) are registered, and any module can also be released with the following URL format:

``http://localhost:8080/group-gpws-buildpack/node_modules/util/doh/runner.html?test=/group-gpws-buildpack/hdx/tests/module.js``

This loads the runner.html page, and it registers the tests seen in module.js with the query ```?test=```.

*releaseTests.html can also be directly loaded, then the test results will appear in the console of a browser*

####module.js
Each module is registered here as such: ```doh.register("name", "HTML path (see below)", timeout)```


####HTML Setup (releaseTests.html)
To use the robot, an HTML page that calls the js script containing the robot is required.

Configuring the dojo paths may be required. See examples.

####Scripts to be loaded (in releaseTests.html):
- dojo.js
- robotFunctions.js (optional)
- tests.js where the tests are written (can be any name, but is tests.js here as example)
- a file where the data is stored (optional)

##Writing the tests (in tests.js):


1. Declare dependencies:
	- ```require(['doh', 'dojo/robotx', 'dojo/keys'])```
2. Initialize robot to the appropriate URL
	- ```robot.initRobot("url")```
3. Register tests
	- ```doh.register("Test set name", test objects)```
	- test objects can be a single object (a single test), or a list of the test objects
	- format of test object:
		```
    {
        name: "name", 
        timeout: 5000, //(any time in milliseconds)
        setUp: function() {} //optional
        runTest: function() {} 
    }```
	- test can be created using the provided RobotFunctions class, with the method createTests
		but if used, then specific arguments and setup are required, see example data
		and method

	- each test needs to return a ```doh.Deferred``` object
	- to use, instantiate: ```var d = doh.Deferred()```
		then sequence it in the robot queue call for test callback: 
        ```
        robot.sequence(d.getTestCallback(function(){
			 // assert methods are used in here 
			 // doh.assertTrue(boolean) (aliased as doh.t) 
			 // doh.assertFalse(boolean) (doh.f) 
			 // doh.assertEqual(obj1, obj2) (doh.is)
			 // doh.assertNotEqual(obj1, obj2) (doh.isNot)
		}```

4. If RobotFunctions are used, the instantiate an object
	- ```var x = new RobotFunctions(robot, keys)```
	- methods in the class can then be used, e.g. ```x.click()```, 
        ```x.changeTextbox()```
5. ```doh.run()```, to execute the registered tests



##Running the tests


1. Running on a server, load the html page that loads the scripts
2. Allow Java to run on page load (may require previous configuration**)
3. Do not touch the mouse or keyboard when tests are running 
	(this will not interrupt the tests, but may cause unintended consequences)
4. Test results and progress are printed in the console, 
	opening it prior to the page load is encouraged

To interrupt tests, quickly move the mouse off the browser window. 
A js alert will appear ```"User aborted test; mouse moved off of browser"```

**To configure the Java permission to run DOHRobot.jar, see https://github.com/dojo/util/tree/master/doh/robot

##RobotFunctions.js


Simplifies use of the DOH Robot with a few functions.

*Must be instantiated with robot and keys from where tests are registered*

```var robotHelper = new RobotDOH(robot, keys);```

The speed of the robot actions can also be adjusted, see variable ``speed`` and its related variables.

###Brief description of methods:

``click()``
- Clicks mouse at current mouse location

```clickAt(dom, x, y)```
- Clicks DOMNode, or specified id

``moveTo(dom, x y)``
- Moves mouse to the node or id

```changeTextbox(valueTo, id)```
- Deletes current value in textbox, and types the given value, valueTo

```changeTextboxDOM(valueTo, dom)```
- Same as ```changeTextbox```, but DOMNode is given as an argument instead of an id

```selectDropdown(dropdown, toSelect, textHeight)```
- Selects the specified item in a dropdown
- ```dropdown``` is the DOMNode of the dropdown
- ```toSelect``` is the index number
- dependent on ```textHeight```, as the mouse movement is based on the height.

``clickAllOptions(dropdown)``
- Clicks through each option in the dropdown
- Returns a doh.Deferred object
- This testing method is not rigorous, it only checks if each selected dropdown item is selected correctly, with    ``dropdown.selectedIndex``

```sliderBoundsTest(slider, textbox)```
- checks boundaries of slider, mouse drags the slider to the minimum and maximum, then checks 1) if the ```slider.value``` is indeed ```slider.min``` or ```slider.max``` respectively. 2) if the corresponding textbox has the same value as ```slider.value```

```moveSlider(moveTo, sliderID)```
- ```moveTo```: drag slider to this specified amount
- ```sliderID```: ID of the slider in the dijit registry
- This may not move the slider to the exact amount specified, depending on the interval of the slider. It is highly unlikely especially if the interval is "infinite". 

```createTests(data, attribute, enterFunction, idOrDOM, verifyResults)```
- Creates a list of tests to be registered with the DOH robot
- ```data```: specific format of a data object, see examples or description below
- ```attribute```: attribute in data object to be used or entered
- ```enterFunction```: method to enter the value obtained, e.g. changeTextbox, moveSlider
- ```idOrDOM```: can either be id of HTML element, or function that retrieves element, which will be needed for items with no id and have to be queried or accessed in a different way than ```doc.getElementById```. *(The DOMNode cannot be passed directly here, as the element may not be present at the time when the robot compiles the tests)*
- ```verifyResults```: function that verifies the results after the data input. Since this is different for different pages or situations, this needs to be written for the different cases.
- How tests created here function:
    1. Iterates through the defined sets of data
    2. Stores data in the test object
    3. Calls ```enterFunction(data[attribute], idOrDOM)```, if ```idOrDOM``` is a function to retrieve the DOMNodes, the DOMNode will be retrieved first.
    4. Returns ```verifyResults(data)```, therefore ```verifyResults``` must return a ```doh.Deferred()``` object


###Limitations & Known Issues
- The positioning of the coordinate system for the robot is not always consistent. Sometimes it may be a few pixels off, and therefore the mouse does not land on the slider focus node before it presses the mouse and drags. However, this usually does not cause issues with text input.
    - *because of this, the dropdown selection is not always accurate*
    - if this is the case, restart the page which will reload the DOH robot
- If ```createTests()``` are used to create tests to be registered, then it is limited to one input method and one input value. However, this can be modified and changed
- For ```d = doh.Deferred()```, ```d.getTestCallback()```, if there are several asserts, once an assert returns false, the rest of the asserts are not run, and the results won't be known.
- Test outputs are only seen in the log page of the doh/runner.html, or console for a browser. Possible solution is to parse the output to JUnit XML form (beautifulsoup is a suggestion)






