Client to the PhIMo project (used in conjunction with PhIMo Server)

An educational WebGL based 3D ridged body physics simulator. 

Contents:
* AGRE: (Andrew's Graphics Rendering Engine) A WebGL rendering engine which includes:
  * 3 camera systems (Cartesian Polar, Y-Oriented Polar and Cartesian Quaternion)
  * Raycast object selection
  * 4 shaders (flat, skeleton, point cloud and Phong lighting) and outline/fresnal shaders to indicate object selection
  * 6 built in shapes
  * A lightweight axis system which renders directly on top of main rendering context
  * An mini axis-based orientation viewport (similar to Blender and Ansys)
* PhIMo Live: A JS-based version of PhIMo Cloud which runs solvers real time in browser
* HTML pages for login, creating/loading/deleting projects, editing projects and running simulations (both live and cloud)
* Precomputed simulations can be saved to PhIMo Server and retreived under the same user at a later date
