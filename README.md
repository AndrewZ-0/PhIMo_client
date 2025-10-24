Client to the PhIMo project (used in conjunction with PhIMo Server https://github.com/AndrewZ-0/PhIMo_server)

PhIMo: An NEA turned passion Project [2024-25 AQA A-Level CS NEA]

PhImo is an educational WebGL based 3D ridged body physics simulator. 

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

Accociated documentation: https://docs.google.com/document/d/1j0QF2ldDMXXGy4Eq_IKLlb9tw-CESxyAJFDS6UvC79I/edit?tab=t.0#heading=h.2oub4qxn803k

How to setup PhIMo for the first time:
1. Make sure you have both PhIMo_Server and PhIMo_Cloud repositories cloned. I would recommend opening both up in seperate terminal contexts.
2. Start the server by running the "main.py" file in PhIMo_Server. The hostname of the server whould then be printed in terminal. Something like "Running on https://127.0.0.1:1234"
3. Run the client and open up the "index.html" or "mainMenu.html" page (I would recomend the Live Preview extension for VSCode). You will be redirected to the main menu page if you open up index.html.
4. Next, add "?server=127.0.0.1:1234" or whatever the hostname is for the PhIMo server. (Note: do not include the protocol and include the port!)
5. If PhIMo Client can connect to the server, you will be free to naviate through the menu freely. If a Cross-Origin Request Blocked message appears in the console, then your machine or network is likely blocking connections to PhIMo Server. I would reccomend trying a different machine or trying to connect using the same machine using localhost. You may also have to give permissions to the client/server since the server is using a self-signed key.
6. If it is your first time logging in, you can create a new account. (Note: all account data is saved directly to PhIMo Server including the hash of the password. The password is never stored on the server and there is no option to "forget password" as of this version)

Some other notes and friendly reminders:
* I would strongly recomend using either Safari, Firefox or Chromium browsers and using the most up-to-date versions. The PhIMo project is only extensively tested on Firefox, Google Chrome, Safari and Brave browsers.
* There are known stability issues with PhIMo Live and certain ODE solvers. These will not crash the program but will produce unintended effects. Please use with caution.
* PhIMo was built with industry-level security. This was just a NEA turned passion project so please be advised against using any sensitive data in credentials or in projects.
* There are many features which I did not end up implamenting due to tight time constraints imposed on the project. The settings for example is one of them. 

Anyways, here are some cool pics of PhIMo!
<img width="1440" height="697" alt="Screenshot 2025-10-23 at 1 17 30 pm" src="https://github.com/user-attachments/assets/71f73b15-75da-4788-baf4-ec914fdfe9f4" />

<img width="1440" height="697" alt="Screenshot 2025-10-23 at 1 09 44 pm" src="https://github.com/user-attachments/assets/956588db-dd2d-4a00-8f21-ee8d7beb4fbb" />

<img width="1440" height="697" alt="Screenshot 2025-10-23 at 1 19 01 pm" src="https://github.com/user-attachments/assets/a37f1256-a5fe-4c50-b41f-62a1bbe162b8" />

<img width="1440" height="697" alt="Screenshot 2025-10-23 at 1 19 56 pm" src="https://github.com/user-attachments/assets/40b2a911-beb0-4d47-82a6-5b6703909c85" />

<img width="1440" height="697" alt="Screenshot 2025-10-23 at 1 21 24 pm" src="https://github.com/user-attachments/assets/0c700629-9f8a-4277-909e-d977326be3e9" />

<img width="1440" height="697" alt="Screenshot 2025-10-23 at 1 22 12 pm" src="https://github.com/user-attachments/assets/9df614a0-1dbc-46ec-8073-0ace867771a4" />

<img width="1440" height="697" alt="Screenshot 2025-10-23 at 1 23 51 pm" src="https://github.com/user-attachments/assets/df219204-234a-4f89-a7ea-770aec926de3" />

<img width="1440" height="697" alt="Screenshot 2025-10-23 at 1 24 52 pm" src="https://github.com/user-attachments/assets/146b4d07-9f8b-460c-ba53-dba36ab8e8d9" />
