'use strict';

(function() {
    $(document).ready(function() {
        tableau.extensions.initializeDialogAsync().then(function (openPayload) {
            buildDialog();
        });
    });

    // build the dialog box and ensure settings are read from
    // the UI namespace and the UI is updated
    function buildDialog() {

        // get existing settings if they exist
        var interval = tableau.extensions.settings.get("interval");
        var allDataSources = tableau.extensions.settings.get("allDataSources");
        
        // initialize select2 list
        $(".js-example-basic-multiple").select2();
        $("#dataSources").prop("disabled",true);

        // set interval if it already exists
        if (interval != undefined) {
            $('#interval').val(interval);
        }

        // set all data sources if already checked
        if (allDataSources == undefined || allDataSources == "Y") {
            $('#allDataSources').attr("checked",true);
            $("#dataSources").text("");
            $("#dataSources").prop("disabled",true);
            //dataSourceListUpdate();
        } else {
            $("#allDataSources").attr("checked",false);
            dataSourceListUpdate();
        }

        // set action on all datasource checkbox to enable/disable the data source list
        $("#allDataSources").on('change','', function() {
            if (document.getElementById("allDataSources").checked == true) {
                // all data sources so clear list and disable options
                $("#dataSources").text("");
                $("#dataSources").prop("disabled",true);
            } else {
                // update list of data sources
                dataSourceListUpdate();
            }
        });



        // set button functions
        $('#cancelButton').click(closeDialog);
        $('#saveButton').click(saveButton);
    }

    // function to populate list of data sources
    function dataSourceListUpdate() {        
        
        // disaply placeholder to indicate loading
        $("#dataSources").select2({
            placeholder: "Loading..."
        });

        // try and get list of data sources selected from settings
        var dataSources = tableau.extensions.settings.get("dataSources");

        var selectedDataSources = [];
        if (dataSources != undefined && dataSources.length > 0) {
            selectedDataSources = dataSources.split("|");
        }


        var dataSourceArray = [];

        // to get list of data sources first loop over each worksheet in the dashboard
        let dashboard = tableau.extensions.dashboardContent.dashboard;
        var worksheetsProcesed = 0;
        dashboard.worksheets.forEach(function (worksheet) {
            // then get the data sources on that worksheet
            worksheet.getDataSourcesAsync().then(dataSources => {
                // loop over each data source
                dataSources.forEach(function (current_dataSource) {
                    if (!dataSourceArray.includes(current_dataSource.name)) {
                        dataSourceArray.push(current_dataSource.name);
                    }
                });
                worksheetsProcesed++;
                if (worksheetsProcesed === dashboard.worksheets.length) {
                    populateList();
                }
            });
        });

        function populateList() {
            // first clear list
            $("#dataSources").text("");
            // populate option list of data sources and select the ones that have already been selected (if any)
            dataSourceArray.forEach(function (dataSource) {
                // if already selected
                if (selectedDataSources.includes(dataSource)) {
                    var selectedDataSourceOption = new Option(dataSource,dataSource,false,true);
                    $("#dataSources").append(selectedDataSourceOption);
                } else {
                    // not selected
                    var newDataSourceOption = new Option(dataSource,dataSource, false, false);
                    $("#dataSources").append(newDataSourceOption);
                }
            });
            $("#dataSources").select2({
                placeholder: ""
            });
            $("#dataSources").prop("disabled",false);
        }
    }

    // close dialog function
    function closeDialog() {
        tableau.extensions.ui.closeDialog("10");
    }

    // save button function
    function saveButton() {
        // save settings

        // refresh interval in secs
        tableau.extensions.settings.set("interval", $("#interval").val());
        // all data sources
        if (document.getElementById("allDataSources").checked == true) {
            tableau.extensions.settings.set("allDataSources","Y");
        } else {
            tableau.extensions.settings.set("allDataSources","N");
        }
        // selected data sources
        var selectedDataSources = $("#dataSources").select2("data").map(ds => ds.text).join("|");
        tableau.extensions.settings.set("dataSources",selectedDataSources);

        // call saveAsync to save settings before calling closeDialog
        tableau.extensions.settings.saveAsync().then((currentSettings) => {
            tableau.extensions.ui.closeDialog("10");
        });
    }


})();