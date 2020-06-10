module.exports.project = {
    /*getProject: function(conn, email){
        let rows = conn.querySync(`SELECT project.file, datecreation, author FROM project JOIN users ON author=users.id WHERE email = '${email}'`);
        if (rows.length > 0) {
            console.log(rows.length);
            return {
                project: {
                    file: rows[0].file,
                    datecreate: rows[0].datecreation,
                    datemodified: rows[0].datelastmodified,
                    author: rows[0].author,
                    depth: rows[i].depth,
                },
                error: null
            };
        }

        return {
            project: null,
            error: "You haven`t any project"
        };
    },*/
    getProjects: function (conn, email) {
        let rows = conn.querySync(`SELECT p.id, file, datecreation, datelastmodified, users.name, depth FROM project as p JOIN users ON author=users.id WHERE email = '${email}' ORDER BY datelastmodified DESC`);
        let result = {
            projects: [],
            error: null,
        };

        if (rows.length > 0) {
            for (let i = 0; i < rows.length; i++) {
                result.projects.push({
                    id: rows[i].id,
                    file: rows[i].file,
                    datecreate: rows[i].datecreation,
                    datemodified: rows[i].datelastmodified,
                    author: rows[i].name,
                    depth: rows[i].depth,
                })
            }
            return result;
        }

        result.error = "Can`t get projects";
        return result
    },

    getAllProjects: function (conn, email) {
        let rows = conn.querySync(`SELECT DISTINCT p.id, file, p.datecreation, datelastmodified, users.name, depth FROM project as p JOIN users ON author=users.id INNER JOIN version ON proot=p.id WHERE email != '${email}' ORDER BY datecreation DESC`);
        let result = {
            projects: [],
            error: null,
        };

        if (rows.length > 0) {
            for (let i = 0; i < rows.length; i++) {
                result.projects.push({
                    id: rows[i].id,
                    file: rows[i].file,
                    datecreate: rows[i].datecreation,
                    datemodified: rows[i].datelastmodified,
                    author: rows[i].name,
                    depth: rows[i].depth,
                })
            }
            return result;
        }

        result.error = "В вашей компании еще нет проектов";
        return result
    },

    createProject: function(conn, email, project){
        let row = conn.querySync(`SELECT id FROM users WHERE email = '${email}'`);
        if(row.length > 0){
            let idUs = row[0].id;
            let res = conn.querySync(`SELECT file FROM project WHERE author = '${idUs}'`);
            let samename = false;
            if(res.length > 0){
                for (let i = 0; i < res.length; i++) {
                    if(res[i].file === project.file){
                        samename = true;
                    }
                }
            }
            if(samename) {
               return {
                   message: null,
                   error: "Проект с данным именем уже существует. Пожалуйста, выберете другое имя"
                }
            } else {
                conn.querySync(`INSERT into project(file, datecreation, datelastmodified, depth, author)` + 
                `VALUES('${project.file}','${project.datecreate}','${project.datemodified}',${project.depth}, ${idUs});`);
                return {
                    message: "Проект успешно создан",
                    error: null
                }
            }
        } else { 
            return {
                message: null,
                error: "Пользователь не найден"
             }
        }
        
    },

    deleteProject: function (conn, file) {
        let row = conn.querySync(`SELECT version.id FROM version JOIN project ON proot = project.id WHERE file = '${file}' `);
        if(row.length > 0){
            for (let i = 0; i < row.length; i++) {
                resId = row[i].id;
                conn.querySync(`DELETE FROM version WHERE id = '${resId}'`);
            }
        }
        conn.querySync(`DELETE FROM project WHERE file = '${file}'`);
    },
   createProjectInV: function(conn, email, project){
    let row = conn.querySync(`SELECT id FROM users WHERE email = '${email}'`);
    if(row.length > 0){
        let idUs = row[0].id;
        let res = conn.querySync(`SELECT file FROM project WHERE author = '${idUs}'`);
        let samename = false;
        if(res.length > 0){
            for (let i = 0; i < res.length; i++) {
                if(res[i].file === project.file){
                    samename = true;
                }
            }
        }
        if(samename) {
           return {
               message: null,
               error: "Проект с данным именем уже существует. Пожалуйста, выберете другое имя"
            }
        } else {
            let row = conn.querySync(`SELECT data, depth FROM version JOIN project ON proot = project.id WHERE version.id = ${project.rootver}`);
            if(row.length > 0){  
                conn.querySync(`INSERT into project(file, datecreation, datelastmodified, depth, author)` + 
                `VALUES('${project.file}','${project.datecreate}','${project.datemodified}',${row[0].depth}, ${idUs});`);
                let res = conn.querySync(`SELECT id FROM project WHERE file ='${project.file}'`);
                conn.querySync(`INSERT into version(version, datecreation, datemodified, data, proot, authorv)` + 
                    `VALUES('version 1', '${project.datecreate}', '${project.datecreate}', '${row[0].data}', ${res[0].id}, ${idUs});`);
                return {
                    message: "Проект успешно создан",
                    error: null
                }
            }
        }
    } else { 
        return {
            message: null,
            error: "Пользователь не найден"
         }
    }
    
   },

   addTag: function(conn, tag){
    let row = conn.querySync(`SELECT authorv, proot FROM version WHERE id=${tag.rootver}`);
    if(row.length > 0){
        conn.querySync(`INSERT INTO tag(description) VALUES('${tag.description}') ON CONFLICT(description) DO NOTHING`);
        let res = conn.querySync(`SELECT id FROM tag WHERE description = '${tag.description}'`);
        conn.querySync(`INSERT INTO project_tag(tag, project) VALUES(${res[0].id}, ${row[0].proot});`);
        return {
            error: null,
            message: "Тег добавлен"
        }   
    } else {
        return {
            error: "Что-то пошло не так",
            message: null
        }
    }
   },

   removeTag: function(conn, tagData){
       conn.querySync(`DELETE from project_tag WHERE tag=${tagData.tagId} AND project=${tagData.projectId}`);
       let row = conn.querySync(`SELECT tag.id FROM tag LEFT OUTER JOIN project_tag ON tag.id=project_tag.tag WHERE project_tag.tag IS NULL`);
       if(row.length > 0){
           for(let i=0; i < row.length; i++){
            conn.querySync(`DELETE FROM tag WHERE id=${row[i].id}`);
           }
           
       }
   },

   createSearch: function(conn){
       let rows = conn.querySync(`SELECT id, name, surname FROM users WHERE "group"='user'`);
       let res = conn.querySync(`SELECT id, description FROM tag`);
       let result = {
        users: [],
        tags: [],
        error: null,
        };
        if (rows.length > 0) {
            for (let i = 0; i < rows.length; i++) {
                result.users.push({
                    id: rows[i].id,
                    name: rows[i].name,
                    surname: rows[i].surname,
                })
            }
            if(res.length > 0){
                for(let i = 0; i < res.length; i++){
                    result.tags.push({
                        id: res[i].id,
                        description: res[i].description,
                    })
                }
            }
            return result;
        }

        result.error = "Can`t get search information";
        return result
   },

   searchProjects: function (conn, searchData, email) {
    let startQuery = `SELECT DISTINCT p.id, file, datecreation, datelastmodified, users.name, users.email, depth FROM project as p JOIN users ON author=users.id `;
    let count = 0;
    let filters = searchData;
    for(let key in searchData){
        if(searchData[key] != "") {
            count++;
        } else{
            delete filters[key];
        }
    }
    // console.log(count);
    // console.log(filters);
    let flag = false;
    
    
    keys = Object.keys(filters);
    if (typeof filters['tag'] !== "undefined") {
       flag = true;
    }
    if(flag){
        startQuery = `SELECT p.id, file, datecreation, datelastmodified, users.name, users.email, depth, description FROM project as p JOIN users ON author=users.id JOIN project_tag ON p.id = project_tag.project JOIN tag ON project_tag.tag=tag.id `; 
    }

    let fieldName;
    let endQuery = ``;
    let lastQuery = ``;
    let orderQuery = ``;
    switch(count){
        case 1: {
            fieldName = this.searchKey(keys, filters, 0);
            lastQuery = this.searchInstruction(fieldName, filters);
            endQuery = startQuery + `WHERE` + lastQuery;
            break;
        }
        case 2: {
            fieldName1 = this.searchKey(keys, filters, 0);
            lastQuery1 = this.searchInstruction(fieldName1, filters);
            fieldName2 = this.searchKey(keys, filters, 1);
            lastQuery2 = this.searchInstruction(fieldName2, filters);
            endQuery = startQuery + `WHERE` + lastQuery1 + ` AND` + lastQuery2;
            break;
        }
        case 3: {
            fieldName1 = this.searchKey(keys, filters, 0);
            lastQuery1 = this.searchInstruction(fieldName1, filters);
            fieldName2 = this.searchKey(keys, filters, 1);
            lastQuery2 = this.searchInstruction(fieldName2, filters);
            fieldName3 = this.searchKey(keys, filters, 2);
            lastQuery3 = this.searchInstruction(fieldName3, filters);
            endQuery = startQuery + `WHERE` + lastQuery1 + ` AND` + lastQuery2 + ` AND` + lastQuery3;
            break;
        }
        case 4: {
            fieldName1 = this.searchKey(keys, filters, 0);
            lastQuery1 = this.searchInstruction(fieldName1, filters);
            fieldName2 = this.searchKey(keys, filters, 1);
            lastQuery2 = this.searchInstruction(fieldName2, filters);
            fieldName3 = this.searchKey(keys, filters, 2);
            lastQuery3 = this.searchInstruction(fieldName3, filters);
            fieldName4 = this.searchKey(keys, filters, 3);
            lastQuery4 = this.searchInstruction(fieldName4, filters);
            endQuery = startQuery + `WHERE` + lastQuery1 + ` AND` + lastQuery2 + ` AND` + lastQuery3 + ` AND` + lastQuery4;
            break;
        }
        case 5: {
            fieldName1 = this.searchKey(keys, filters, 0);
            lastQuery1 = this.searchInstruction(fieldName1, filters);
            fieldName2 = this.searchKey(keys, filters, 1);
            lastQuery2 = this.searchInstruction(fieldName2, filters);
            fieldName3 = this.searchKey(keys, filters, 2);
            lastQuery3 = this.searchInstruction(fieldName3, filters);
            fieldName4 = this.searchKey(keys, filters, 3);
            lastQuery4 = this.searchInstruction(fieldName4, filters);
            fieldName5 = this.searchKey(keys, filters, 4);
            lastQuery5 = this.searchInstruction(fieldName4, filters);
            endQuery = startQuery + `WHERE` + lastQuery1 + ` AND` + lastQuery2 + ` AND` + lastQuery3 + ` AND` + lastQuery4 + ` AND` + lastQuery5;
            break;
        }
        case 6: {
            fieldName1 = this.searchKey(keys, filters, 0);
            lastQuery1 = this.searchInstruction(fieldName1, filters);
            fieldName2 = this.searchKey(keys, filters, 1);
            lastQuery2 = this.searchInstruction(fieldName2, filters);
            fieldName3 = this.searchKey(keys, filters, 2);
            lastQuery3 = this.searchInstruction(fieldName3, filters);
            fieldName4 = this.searchKey(keys, filters, 3);
            lastQuery4 = this.searchInstruction(fieldName4, filters);
            fieldName5 = this.searchKey(keys, filters, 4);
            lastQuery5 = this.searchInstruction(fieldName4, filters);
            fieldName6 = this.searchKey(keys, filters, 5);
            lastQuery6 = this.searchInstruction(fieldName4, filters);
            endQuery = startQuery + `WHERE` + lastQuery1 + ` AND` + lastQuery2 + ` AND` + lastQuery3 + ` AND` + lastQuery4 + ` AND` + lastQuery5 + ` AND` + lastQuery6;
            break;
        }
        
    }
    console.log(endQuery);
    
    if(flag) {
        orderQuery = endQuery + ` ORDER BY p.id`;
    }else {
        orderQuery = endQuery + ` ORDER BY datelastmodified DESC`;
    }
    

    let rows = conn.querySync(orderQuery);
    let result = {
        projects: [],
        error: null,
    };

    if (rows.length > 0) {
        for (let i = 0, j = 1; i < rows.length; i++, j++) {
            let check = (rows[i].email === email)?true:false;
            // console.log("check ", check);
            // console.log(rows[i]);
            if(flag){
                let capt = false;
                if(i != rows.length-1 && rows[i].id == rows[j].id) {
                    capt = true;
                    if(!capt){
                            result.projects.unshift({
                                id: rows[i].id,
                                file: rows[i].file,
                                datecreate: rows[i].datecreation,
                                datemodified: rows[i].datelastmodified,
                                author: rows[i].name,
                                depth: rows[i].depth,
                                isAuthor: check,
                            })
                    }else {
                        capt = false;
                    }
                }else if(!capt){
                        result.projects.push({
                            id: rows[i].id,
                            file: rows[i].file,
                            datecreate: rows[i].datecreation,
                            datemodified: rows[i].datelastmodified,
                            author: rows[i].name,
                            depth: rows[i].depth,
                            isAuthor: check,
                        })
                    }
            }else {
                result.projects.push({
                    id: rows[i].id,
                    file: rows[i].file,
                    datecreate: rows[i].datecreation,
                    datemodified: rows[i].datelastmodified,
                    author: rows[i].name,
                    depth: rows[i].depth,
                    isAuthor: check,
                })
            }
            
        }
        return result;
    }
    result.error = "Проекты не найдены. Попробуйте изменить параметры поиска";
    return result
},
    searchKey: function (keys, filters, i){
            switch(keys[i]){
                case "fileName": 
                    return "file";
                case "authorName":
                    return "author";
                case "startDateCreate":
                    return "datecreation1";
                case "endDateCreate":
                    return "datecreation2";
                case "startDateMod":
                    return "datelastmodified1";
                case "endDateMod":
                    return "datelastmodified2";
                case "tag":
                    return "description";
                default: 
                    return "";
            }
    },

    searchInstruction: function(fieldName, filters){
        switch(fieldName){
            case "file": {
                let searchName = filters["fileName"] + "%";
                // console.log(searchName);
                return ` ${fieldName} LIKE '${searchName}'`;
            }
            case "author": {
                return ` ${fieldName} = ${filters["authorName"]}`;
            }
            case "datecreation1": {
                let field = fieldName.slice(0, fieldName.length -1);
                return ` ${field} >= '${filters["startDateCreate"]}'`;
            }
            case "datecreation2": {
                let field = fieldName.slice(0, fieldName.length -1);
                return ` ${field} <= '${filters["endDateCreate"]}'`;
            }
            case "datelastmodified1": {
                let field = fieldName.slice(0, fieldName.length -1);
                return ` ${field} >= '${filters["startDateMod"]}'`;
            }
            case "datelastmodified2": {
                let field = fieldName.slice(0, fieldName.length -1);
                return ` ${field} <= '${filters["endDateMod"]}'`;
            }
            case "description":{
                if(filters["tag"].includes(" ")){
                    let str = filters["tag"];
                    let arrayOfStrings = str.split(' ');
                    // console.log(arrayOfStrings);
                    // console.log("length",arrayOfStrings.length);
                    let query = ``;
                    for(let i = 0; i < arrayOfStrings.length; i++){
                        query += ` ${fieldName} = '${arrayOfStrings[i]}'`;
                        if(i != arrayOfStrings.length - 1){
                            query += ` OR`; 
                        }
                    }
                    return query;
                }else {
                    return ` ${fieldName} = '${filters["tag"]}'`;
                }
            }
        }
    }
}
