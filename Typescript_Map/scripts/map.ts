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
        public static html_window = window;



        constructor(form: HTMLFormElement) {
            Map._this = this;

            var button = document.querySelector('#submit');
            
            this.initialize_map();

            this.setup_puuchDB();

            button.addEventListener('click', function (e) {
                Map._this.addFeature(Number($("#point1_x").val()), Number($("#point1_y").val()), Number($("#point2_x").val()), Number($("#point2_y").val()));                
                e.preventDefault();
            });
        }
                
        addFeature = (x1: number, y1: number, x2: number, y2: number): void => {
            if (x2 != 0 && y2 != 0) {
                Map._this.addline(x1, y1, x2, y2);
            } else
            Map._this.addPoint(x1, y1);
        }

        addPoint = (x: number, y: number): void => {
            L.marker([x, y]).addTo(Map.mymap);
        }

        addline = (x1: number, y1: number, x2: number, y2: number): void => {
            var pointA = new L.LatLng(x1, y1);
            var pointB = new L.LatLng(x2, y2);
            var pointList = [pointA, pointB];

            var firstpolyline = new L.Polyline(pointList).addTo(Map.mymap);
            Map.mymap.setView([(x1 + x2) / 2, (y1 + y2) / 2]);
        }

        initialize_map():void
        {
            $("h1").css("font-size", "36px");

            
           
            Map.mymap = new L.Map('mapid', { editable:true}).setView([36,-96], 13);

            

            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="http://mapbox.com">Mapbox</a>',
                id: 'mapbox.streets'
            }).addTo(Map.mymap);
     
            L.circle([39.19, -96.5], 500, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5
            }).addTo(Map.mymap).bindPopup("I am a circle.");

            L.polygon([
                [39.18, -96.5],
                [39.19, -96.6],
                [39.17, -96.55]
            ]).addTo(Map.mymap).bindPopup("I am a polygon.");





            Map.drawnItems = new L.FeatureGroup();
            Map.mymap.addLayer(Map.drawnItems);
                    
            var drawControl = new L.Control.Draw({
                edit: {
                    featureGroup: Map.drawnItems
                }
            });
            
            Map.mymap.addControl(drawControl);  

           
            //  Fired when start editting
            Map.mymap.on('draw:created', function (e) {
                var title,
                    type = e.layerType,
                    layer = e.layer,
                    layerJSON,
                    newFeature;


                navigator.notification.prompt(
                    'Please give a title',  // message
                    saveFeatureToDB,        // callback to invoke
                    'New Task',            // title
                    ['Ok', 'Exit'],             // buttonLabels
                    'Inspection #1'                 // defaultText
                );

                function saveFeatureToDB(results):void
                {
                    title = results.input1;
                    layer.title = title,
                    layerJSON = layer.toGeoJSON(),
                    newFeature = {
                            _id: title,
                            jsonString: JSON.stringify(layerJSON)
                        };

                    //  save in db
                    Map.db.put(newFeature).then(function () {
                    }).catch(function (err) {
                        if (err.name === 'conflict') {
                            window.alert("This title has already been used please give it another title");
                        } else {
                            // some other error
                        }
                    });
                }

                

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
                var i = 1;
            });

            function onMapClick(e) {
              // var popup = L.popup(); popup.setLatLng(e.latlng).setContent("You clicked the map at " + e.latlng.toString()).openOn(Map.mymap);
/*
                var point = new L.LatLng(Number(e.latlng.lat.toString()), Number(e.latlng.lng.toString()));

                //  Save them in the db
                Map.db.get('line').then(function (line) {
                    line.path_pt.push(point);
                    return Map.db.put(line);
                }).then(function () {
                    return Map.db.get('line');
                }).then(function (doc) {
                    console.log(doc);
                    });

                //  Show them
                Map.pt_list.push(point);
                if (Map.temp_polyline != null)
                    Map.mymap.removeLayer(Map.temp_polyline);
                Map.temp_polyline = new L.Polyline(Map.pt_list).addTo(Map.mymap);
*/
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
 
            Map.db.allDocs({ include_docs: true, descending: true }, function (err, result) {
                var features = result.rows;

                for (var i = 0; i < features.length; i++) {
                    //  if it is a point
                    Map.db.get(features[i].doc._id).then(function (doc) {
                        return Map.db.remove(doc);
                    });
                    
                }
            });

*/ }

            Map.db.allDocs({ include_docs: true, descending: true }, function (err, result) {
                var features = result.rows;

                for (var i = 0; i < features.length; i++)
                {
                    var json = JSON.parse(features[i].doc.jsonString);
                    var geoJSON = L.geoJson(json);
                    var newLayer = geoJSON.getLayers()[0];
                    Map.drawnItems.addLayer(newLayer);
                }
            });
            /*
            db.changes({
                since: 'now',
                live: true
            }).on('change', showTodos);   */
        }


    }


    

}