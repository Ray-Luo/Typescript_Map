

module Task {
    "use strict";



    export class Task {

        name: String;
        features = new L.FeatureGroup();
        last_modified: String;
        author: String;

        constructor()
        { }


        addTask(name: String, author: String): void {


            this.name = name;
            this.author = author;
        }

        saveTask(): void {
            //  Save to DB
        }

        editTask(): void {
            //  Edit features on the map
        }

        deleteTask(): void {
            //  delete DB entry
        }
    }

}