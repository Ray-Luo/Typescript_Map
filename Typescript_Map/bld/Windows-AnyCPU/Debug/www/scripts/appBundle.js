/// <reference path="jquery.d.ts"/>
/// <reference path="pouch.d.ts"/>
/// <reference path="typings/leaflet-draw/leaflet-draw.d.ts"/>
var Map;
(function (Map_1) {
    "use strict";
    var Map = (function () {
        function Map(form) {
            this.form = $("#form");
            this.submitButton = $("#submit");
            Map._this = this;
            Map.new_task_btn.addEventListener('click', function (e) {
                Map.save_task_btn.disabled = false;
                document.getElementById('abc').style.display = "block";
                document.getElementById('content').style.display = "none";
            });
            Map.add_btn.addEventListener('click', function (e) {
                Map.task_title = $("#title").val();
                Map.author = $("#author").val();
                document.getElementById('abc').style.display = "none";
                document.getElementById('content').style.display = "block";
                if (Map.drawnItems.length != 0) {
                    if (Map.drawControl === undefined) {
                        // enable edit
                        Map.drawControl = new L.Control.Draw({
                            draw: {
                                polygon: true,
                                polyline: true,
                                rectangle: true,
                                circle: true,
                                marker: true,
                            },
                            edit: {
                                featureGroup: Map.drawnItems
                            }
                        });
                        Map.mymap.addControl(Map.drawControl);
                    }
                }
            });
            Map.save_task_btn.addEventListener('click', function (e) {
                navigator.notification.confirm('Click Yes to save "' + Map.task_title + '"', // message
                saveTask, // callback
                'Save this task?', // title
                ['Yes', 'Cancel'] // buttonName
                );
                //  save to db
                function saveTask() {
                    var db_entry = {
                        _id: Map.task_title,
                        author: Map.author,
                        last_modified: new Date().toISOString(),
                        JSONList: Map.JSONStringList
                    };
                    Map.db.put(db_entry).then(function () {
                        Map.edit_task_btn.disabled = false;
                        Map.delete_task_btn.disabled = false;
                    }).catch(function (err) {
                        if (err.name === 'conflict') {
                            navigator.notification.alert('There is an entry with title "' + Map.task_title + '" already exsiting in the database', // message
                            rename_title, // callback
                            'Title Conflict!', // title
                            'Done' // buttonName
                            );
                        }
                        else {
                        }
                    });
                }
                //  Error handler for title conflict
                function rename_title() {
                    document.getElementById('abc').style.display = "block";
                    document.getElementById('content').style.display = "none";
                }
            });
            Map.edit_task_btn.addEventListener('click', function (e) {
                if (Map.drawControl != null)
                    Map.mymap.removeControl(Map.drawControl);
                if (Map.drawnItems.length != 0) {
                    // enable edit
                    Map.drawControl = new L.Control.Draw({
                        draw: {
                            polygon: false,
                            polyline: true,
                            rectangle: false,
                            circle: false,
                            marker: true,
                        },
                        edit: {
                            featureGroup: Map.drawnItems
                        }
                    });
                    Map.mymap.addControl(Map.drawControl);
                }
            });
            this.initialize_map();
            this.setup_puuchDB();
        }
        ;
        Map.prototype.initialize_map = function () {
            $("h1").css("font-size", "36px");
            Map.save_task_btn.disabled = true;
            var edit_task_btn = document.querySelector('#edit-task');
            var delete_task_btn = document.querySelector('#delete-task');
            //  Setting up leaflet map
            Map.mymap = new L.Map('mapid', { editable: true }).setView([36, -96], 13);
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
                id: 'mapbox.streets'
            }).addTo(Map.mymap);
            //  Initilize a FeatureGroup which stores all layers in order to edit them
            Map.drawnItems = new L.FeatureGroup();
            Map.mymap.addLayer(Map.drawnItems);
            //  Fired when start editting
            Map.mymap.on('draw:created', function (e) {
                var title, type = e.layerType, layer = e.layer, layerJSON, newFeature;
                // add JSON string to the list
                layer.title = Map.task_title + Map.featureID_autoincrement;
                layerJSON = layer.toGeoJSON();
                Map.JSONStringList.push(JSON.stringify(layerJSON));
                //  add layer to map
                Map.drawnItems.addLayer(layer);
                Map.mymap.addLayer(layer);
            });
            //  Fired when finished editting
            Map.mymap.on('draw:edited', function (e) {
                var shape;
                var layers = e.layers;
                layers.eachLayer(function (layer) {
                    //do whatever you want, most likely save back to db
                    var layerJSON = layer.toGeoJSON();
                    Map.db.get(layer.title).then(function (doc) {
                        return Map.db.put({
                            _id: doc._id,
                            _rev: doc._rev,
                            jsonString: JSON.stringify(layerJSON)
                        });
                    }).then(function (response) {
                        // handle response
                    }).catch(function (err) {
                        console.log(err);
                    });
                });
            });
            Map.mymap.on('draw:deleted', function (e) {
                // Update db to save latest changes.
            });
            function onMapClick(e) {
            }
            Map.mymap.on('click', onMapClick);
        };
        Map.prototype.setup_puuchDB = function () {
            Map.db = new PouchDB("LeveeInspection_1");
            {
            }
            //  Reading layers from db
            Map.db.allDocs({ include_docs: true, descending: true }, function (err, result) {
                var tasks = result.rows;
                for (var i = 0; i < tasks.length; i++) {
                    for (var j = 0; j < tasks[i].doc.JSONList.length; j++) {
                        var json = JSON.parse(tasks[i].doc.JSONList[j]);
                        var geoJSON = L.geoJson(json);
                        var newLayer = geoJSON.getLayers()[0];
                        Map.drawnItems.addLayer(newLayer);
                    }
                }
                if (Map.drawnItems.length === 0) {
                    Map.edit_task_btn.disabled = true;
                    Map.delete_task_btn.disabled = true;
                }
            });
        };
        Map.point_flag = 0;
        Map.line_flag = 1;
        Map.pt_list = [];
        Map.JSONStringList = [];
        Map.featureID_autoincrement = 0;
        Map.new_task_btn = document.querySelector('#new-task');
        Map.edit_task_btn = document.querySelector('#edit-task');
        Map.save_task_btn = document.querySelector('#save-task');
        Map.delete_task_btn = document.querySelector('#delete-task');
        Map.add_btn = document.querySelector('#submit');
        return Map;
    }());
    Map_1.Map = Map;
})(Map || (Map = {}));
// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397705
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
/// <reference path="jquery.d.ts"/>
/// <reference path="map.ts"/>
var TypescriptMap;
(function (TypescriptMap) {
    "use strict";
    var Application;
    (function (Application) {
        function initialize() {
            document.addEventListener('deviceready', onDeviceReady, false);
        }
        Application.initialize = initialize;
        function onDeviceReady() {
            // Handle the Cordova pause and resume events
            document.addEventListener('pause', onPause, false);
            document.addEventListener('resume', onResume, false);
            // TODO: Cordova has been loaded. Perform any initialization that requires Cordova here.
            var parentElement = document.getElementById('deviceready');
            var listeningElement = parentElement.querySelector('.listening');
            var receivedElement = parentElement.querySelector('.received');
            listeningElement.setAttribute('style', 'display:none;');
            receivedElement.setAttribute('style', 'display:block;');
            var map = new Map.Map(document.getElementById('form'));
        }
        function onPause() {
            // TODO: This application has been suspended. Save application state here.
        }
        function onResume() {
            // TODO: This application has been reactivated. Restore application state here.
        }
    })(Application = TypescriptMap.Application || (TypescriptMap.Application = {}));
    window.onload = function () {
        Application.initialize();
    };
})(TypescriptMap || (TypescriptMap = {}));
var Task;
(function (Task_1) {
    "use strict";
    var Task = (function () {
        function Task() {
            this.features = new L.FeatureGroup();
        }
        Task.prototype.addTask = function (name, author) {
            this.name = name;
            this.author = author;
        };
        Task.prototype.saveTask = function () {
            //  Save to DB
        };
        Task.prototype.editTask = function () {
            //  Edit features on the map
        };
        Task.prototype.deleteTask = function () {
            //  delete DB entry
        };
        return Task;
    }());
    Task_1.Task = Task;
})(Task || (Task = {}));
//# sourceMappingURL=appBundle.js.map