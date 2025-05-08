// $(function () {
//     let files = fetchProjectList();
//     $("#automplete-1").autocomplete({
//         source: files,
//         minLength: 2,
//         select: function (event, ui) {
//             localStorage["selectedProject"] = ui.item.label;
//             // value = localStorage["selectedProject"];
//             triggerClick(ui.item);
//             // return true;
//             // $( "#project-tab" ).tabs( "load", "#project" );
//         }
//     });

//     let triggerClick = (item) => {
//         console.log("select item is : " + JSON.stringify(item))
//         // $("#project-tab").trigger("click");
//         $('#project').load('./html/project.html');
//         // $('#workspace-tab').removeClass('active');
//         // $('#project-tab').addClass('active');
//         // let id = parent.document.getElementById('project-tab');
//         // console.log("id is: " + JSON.stringify(id))
//         // $('#' + id).trigger('click');
//         // $('#project').load('./html/project.html');
//     }
// });

// function fetchProjectList() {
//     var filenames = [];
//     var rawFile = new XMLHttpRequest();
//     rawFile.open("GET", 'file:///C:/Users/Public/UHChromeExtentionConfig.txt', false);
//     rawFile.onreadystatechange = function () {
//         if (rawFile.readyState === 4) {
//             if (rawFile.status === 200 || rawFile.status == 0) {
//                 console.log('coming inside status');
//                 let filePath = rawFile.response.split('=')[1].trim();
//                 filePath = filePath + "//extractor";
//                 console.log(filePath);
//                 filenames = extractFileNames(filePath);
//             }
//         }
//     }
//     rawFile.send(null);
//     return filenames;
// }

// function extractFileNames(url) {
//     var filenames = [];
//     let req = new XMLHttpRequest();
//     req.open("GET", url, false);
//     req.onreadystatechange = function () {
//         if (req.status === 0) {
//             $('#log-list').html(req.responseText);
//             let files = document.querySelectorAll("a.icon.file");
//             files.forEach(function (item) { filenames.push(item.textContent.split(".extract")[0]) })
//             console.log(filenames);
//         }
//     };
//     req.send(null);
//     return filenames
// }