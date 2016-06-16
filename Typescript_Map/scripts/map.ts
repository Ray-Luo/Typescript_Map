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
      //  public static length;
        public static pt_list = [];
        public static temp_polyline;
       



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

            var drawnItems = new L.FeatureGroup();
            Map.mymap.addLayer(drawnItems);
                    
            var drawControl = new L.Control.Draw({
                edit: {
                    featureGroup: drawnItems
                }
            });
            
            Map.mymap.addControl(drawControl);  

            Map.mymap.on('draw:created', function (e) {
                var type = e.layerType,
                    layer = e.layer;
                
                if (type === 'marker') {
                    // Do marker specific actions
                    //var point: L.Marker = new L.Marker([]);
                   // point = <L.Marker>layer;
                    //point.editing.enable();
                }

                var polygon = new L.Polygon([
                    [51.51, -0.1],
                    [51.5, -0.06],
                    [51.52, -0.03]
                ]);
                polygon.enableEdit();

                // Do whatever else you need to. (save to db, add to map etc)
                Map.mymap.addLayer(layer);
            });

            Map.mymap.on('draw:edited', function (e) {
                var type = e.layerType,
                    layer = e.layer;

                if (type === 'marker') {
                    // Do marker specific actions
                }

                // Do whatever else you need to. (save to db, add to map etc)
                Map.mymap.addLayer(layer);
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

            var base_pt_start = new L.LatLng(36, -96);
            var base_pt_end = new L.LatLng(36.1, -96.1);

            var line = {
                _id: "line",
                flag: Map.line_flag,
                base_pt: [base_pt_start, base_pt_end],
                path_pt: []
            }

            Map.db.bulkDocs([line]);*/ }

            Map.db.allDocs({ include_docs: true, descending: true }, function (err, result) {
                var features = result.rows;
                /*
                Map.pt_list.push(features[0].doc.base_pt[1]);

                var path_pt_length = features[0].doc.path_pt.length;
                if (path_pt_length != 0)
                    for (var i = 0; i < path_pt_length; i++)
                        Map.pt_list.push(features[0].doc.path_pt[i]);
                Map.pt_list.push(features[0].doc.base_pt[0]);
                Map.pt_list.push(features[0].doc.base_pt[1]);
                Map.temp_polyline = new L.Polyline(Map.pt_list).addTo(Map.mymap);


                Map.db.allDocs({ include_docs: true, descending: true }, function (err, result) {
                    var features = result.rows;
                });                
                */
            });


            
            /*
            db.changes({
                since: 'now',
                live: true
            }).on('change', showTodos);   */
        }


    }


    

}