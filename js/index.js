'use strict';

(function() {

    // var to hold ref to the unregister event listener function
    let unregisterSettingsEventListener = null;

    // var to hold cancellation of refresh loop
    var loopCancelled = false;

    $(document).ready(function() {
        // add config option to call the config function
        tableau.extensions.initializeAsync({ 'configure': configure}).then(function() {
            // call function to do data refresh
            dataRefresh();

            // add settings listeners
            unregisterSettingsEventListener = tableau.extensions.settings.addEventListener(tableau.TableauEventType.SettingsChanged, (settingsEvent) => {
                dataRefresh();
            });
        });
    }, function() {console.log('Error while initializing: ' + err.toString());});

    // main function to do refresh
    function dataRefresh() {
        // get settings if they exist
        var interval = tableau.extensions.settings.get("interval");
        var allDataSources = tableau.extensions.settings.get("allDataSources");
        var dataSources = tableau.extensions.settings.get("dataSources");

        // need at least an interval defined and either allDataSource == "Y" or allDataSources = "N" and a list of dataSources defined
        if (interval != undefined && interval > 0 && (
            (allDataSources != undefined && allDataSources == "Y") || 
            (allDataSources != undefined && allDataSources == "N" && dataSources != undefined && dataSources.length > 0))) {
                $("#configure").hide();

                console.log("Loaded Settings Successfully");
                console.log("Interval: " + interval);
                console.log("All Data Sources: " + allDataSources);
                if (allDataSources == "N") {
                    console.log("Data Sources: " + dataSources);
                }

                // reset loop cancellation
                loopCancelled = false;

                // get the data sources to refresh in an array
                // first get the dashboard
                let dashboard = tableau.extensions.dashboardContent.dashboard;
                var worksheetsProcesed = 0;
                var dataSourceArray = [];
                if (dataSources != undefined && dataSources.length > 0 && allDataSources == "N") {
                    // split out selected data sources into an array
                    var selectedDataSources = dataSources.split("|");
                    // get all the worksheets and loop over them
                    dashboard.worksheets.forEach(function (worksheet) {
                        // then get the data sources on that worksheet
                        worksheet.getDataSourcesAsync().then(dS => {
                            // loop over each data source
                            dS.forEach(function (current_dataSource) {
                                if (selectedDataSources.includes(current_dataSource.name) && !dataSourceArray.map(d => d.name).includes(current_dataSource.name)) {
                                    dataSourceArray.push(current_dataSource);
                                }
                            });
                            worksheetsProcesed++;
                            if (worksheetsProcesed === dashboard.worksheets.length) {
                                runRefresh();
                            }
                        });
                    });
                } else if (allDataSources == "Y") {
                    // get all the worksheets and loop over them
                    dashboard.worksheets.forEach(function (worksheet) {
                        // then get the data sources on that worksheet
                        worksheet.getDataSourcesAsync().then(dS => {
                            // loop over each data source
                            dS.forEach(function (current_dataSource) {
                                if (!dataSourceArray.map(d => d.name).includes(current_dataSource.name)) {
                                    dataSourceArray.push(current_dataSource);
                                }
                            });
                            worksheetsProcesed++;
                            if (worksheetsProcesed === dashboard.worksheets.length) {
                                runRefresh();
                            }
                        });
                    });
                }

                function runRefresh() {

                    // cancel loop if it has been cancelled
                    if (loopCancelled) {
                        return;
                    }

                    var promises = [];

                    for (var i = 0; i < dataSourceArray.length; i++) {
                        console.log("Refreshing " + dataSourceArray[i].name);
                        promises.push(dataSourceArray[i].refreshAsync());
                    }

                    Promise.all(promises).then(() => {
                        wTR();
                    });

                    const delay = ms => new Promise(res => setTimeout(res, ms));

                    async function wTR() {
                        await delay(interval * 1000);
                        console.log("Waited " + interval + "s");

                        runRefresh();
                    }
                }
                

        } else {
            // missing some config
            $("#configure").show();
            // exit function as no config
            return;
        }
    }


    // config button
    function configure() {
        // cancel any existing loop
        loopCancelled = true;

        const popupUrl = `${window.location.href.replace(/[^/]*$/, '')}/dialog.html`;

        let input = "";

        tableau.extensions.ui.displayDialogAsync(popupUrl, input, {height: 540, width: 950}).then((closePayload) => {
            
        }).catch((error) => {
            // one expected error condition is when the popup is closed by the user (clicking on the 'x')
            switch (error.errorCode) {
                case tableau.ErrorCodes.DialogClosedByUser:
                    console.log("Dialog was closed by user");
                    break;
                default:
                    console.log(error.message);
            }
        });
    }
})();