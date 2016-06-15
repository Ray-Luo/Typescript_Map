/// <reference path="jquery.d.ts"/>
/// <reference path="pouch.d.ts"/>

module Map
{
    "use strict";



    export class Map
    {

        public static mymap: L.Map;
        public static _this;
        private form: JQuery = $("#form");
        private submitButton: JQuery = $("#submit");
        public static db;
        public static point_flag = 0;
        public static line_flag = 1;
        public static cursor_x;
        public static cursor_y;
        public static length;
        public static pt_list = [];
       



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

            Map.mymap = new L.Map('mapid').setView([36,-96], 13);
                                              
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

            var popup = L.popup();

            function onMapClick(e) {
                popup
                    .setLatLng(e.latlng)
                    .setContent("You clicked the map at " + e.latlng.toString())
                    .openOn(Map.mymap);

                Map.cursor_x = e.latlng.lat.toString();
                Map.cursor_y = e.latlng.lng.toString();

                Map.db.allDocs({ include_docs: true, descending: true }, function (err, result) {
                    var features = result.rows;
                });

                Map.db.get('line').then(function (line) {
                    line.path_pt.x.push(Map.cursor_x);
                    line.path_pt.y.push(Map.cursor_y);
                    Map.length = line.path_pt.x.length();
                    return Map.db.put(line);
                }).then(function () {                    
                    return Map.db.get('line');
                }).then(function (doc) {
                    console.log(doc);
                    });

                Map.db.get('line').then(function (line) {
                    var pt_list_x = [];
                    var pt_list_y = [];
                    //var pt_list = [];
                    pt_list_x.push(line.base_pt.x[0]);
                    pt_list_y.push(line.base_pt.y[0]);

                    for (var i = 0; i < line.path_pt.x.length; i++) {
                        pt_list_x.push(line.path_pt.x[i]);
                        pt_list_y.push(line.path_pt.y[i]);
                    }


                    pt_list_x.push(line.base_pt.x[1]);
                    pt_list_y.push(line.base_pt.y[1]);

                    for (var i = 0; i < pt_list_x.length; i++) {
                        Map.pt_list.push(new L.LatLng(pt_list_x[i], pt_list_y[i]));
                    }

                    var polyline = new L.Polyline(Map.pt_list).addTo(Map.mymap);
                    
                }).then(function () {
                    return Map.db.get('line');
                }).then(function (doc) {
                    console.log(doc);
                });

                /*
                            var pointA = new L.LatLng(x1, y1);
            var pointB = new L.LatLng(x2, y2);
            var pointList = [pointA, pointB];

            var firstpolyline = new L.Polyline(pointList).addTo(Map.mymap);
            Map.mymap.setView([(x1 + x2) / 2, (y1 + y2) / 2]);
                */
            }

            Map.mymap.on('click', onMapClick);
        }

        setup_puuchDB(): void
        {                      
            Map.db = new PouchDB("LeveeInspection_1");

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
            });*/




            var line = {
                _id: "line",
                flag: Map.line_flag,
                base_pt: { x: [36, 36.1], y: [-96, -96.1] },
                path_pt: { x: [], y: [] }
            }

            Map.db.bulkDocs([line]);

            Map.db.allDocs({ include_docs: true, descending: true }, function (err, result) {
                var features = result.rows;

                for (var i = 0; i < features.length;i++)
                {
                    //  if it is a point
                    if (Number(features[i].doc.flag) == 0) {
                        Map._this.addPoint(Number(features[i].doc.base_pt.x[0]), Number(features[i].doc.base_pt.y[0]));
                    } else  // if a line
                    {
                        Map._this.addline(Number(features[i].doc.base_pt.x[0]), Number(features[i].doc.base_pt.y[0]), Number(features[i].doc.base_pt.x[1]), Number(features[i].doc.base_pt.y[1]));
                    }
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