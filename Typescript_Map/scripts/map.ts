/// <reference path="jquery.d.ts"/>
/// <reference path="pouch.d.ts"/>
/// <reference path="typings/leaflet-draw/leaflet-draw.d.ts"/>

module Map
{
    "use strict";



    export class Map
    {

        public static mymap;
        public static _this;
        private form: JQuery = $("#form");
        private submitButton: JQuery = $("#submit");
        public static db;
        public static point_flag = 0;
        public static line_flag = 1;
        public static cursor_x;
        public static cursor_y;
        public static pt_list = [];
        public static temp_polyline;
        public static drawnItems;
        public static JSONStringList = [];
        public static featureID_autoincrement = 0;
        public static task_title;
        public static author;
        public static drawControl;
        public static new_task_btn: HTMLButtonElement = <HTMLButtonElement>document.querySelector('#new-task');;
        public static edit_task_btn: HTMLButtonElement = <HTMLButtonElement>document.querySelector('#edit-task');
        public static save_task_btn: HTMLButtonElement = <HTMLButtonElement>document.querySelector('#save-task');
        public static delete_task_btn: HTMLButtonElement = <HTMLButtonElement>document.querySelector('#delete-task');
        public static add_btn: HTMLButtonElement = <HTMLButtonElement>document.querySelector('#submit');


        constructor(form: HTMLFormElement) {
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
                navigator.notification.confirm(
                    'Click Yes to save "' + Map.task_title + '"',  // message
                    saveTask,         // callback
                    'Save this task?',            // title
                    ['Yes', 'Cancel']                  // buttonName
                );

                //  save to db
                function saveTask(): void {
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
                            navigator.notification.alert(
                                'There is an entry with title "' + Map.task_title + '" already exsiting in the database',  // message
                                rename_title,         // callback
                                'Title Conflict!',            // title
                                'Done'                  // buttonName
                            );
                        } else {
                            // some other error
                        }
                    });
                }

                //  Error handler for title conflict
                function rename_title(): void {
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
                

        initialize_map():void
        {
            $("h1").css("font-size", "36px");

            Map.save_task_btn.disabled = true;

            var edit_task_btn = document.querySelector('#edit-task');
            var delete_task_btn = document.querySelector('#delete-task');
            
           //  Setting up leaflet map
            Map.mymap = new L.Map('mapid', { editable:true}).setView([36,-96], 13);
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
                var title,
                    type = e.layerType,
                    layer = e.layer,
                    layerJSON,
                    newFeature;

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
        }

        setup_puuchDB(): void
        {                      
            Map.db = new PouchDB("LeveeInspection_1");

            {
           /*
            Map.db.destroy().then(function (response) {
                // success
            }).catch(function (err) {
                console.log(err);
            });   
          */ }


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


        }


    }


    

}