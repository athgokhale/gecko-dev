/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

function run_test() {
  Services.prefs.setCharPref("browser.search.geoip.url", 'data:application/json,{"country_code": "AU"}');
  Services.search.init().then(() => {
    equal(Services.prefs.getCharPref("browser.search.region"), "AU", "got the correct region.");
    // check we have "success" recorded in telemetry
    checkCountryResultTelemetry(TELEMETRY_RESULT_ENUM.SUCCESS);
    // a false value for each of SEARCH_SERVICE_COUNTRY_TIMEOUT and SEARCH_SERVICE_COUNTRY_FETCH_CAUSED_SYNC_INIT
    for (let hid of ["SEARCH_SERVICE_COUNTRY_TIMEOUT",
                     "SEARCH_SERVICE_COUNTRY_FETCH_CAUSED_SYNC_INIT"]) {
      let histogram = Services.telemetry.getHistogramById(hid);
      let snapshot = histogram.snapshot();
      deepEqual(snapshot.values, {0: 1, 1: 0}); // boolean probe so 3 buckets, expect 1 result for |0|.
    }

    // simple checks for our platform-specific telemetry.  We can't influence
    // what they return (as we can't influence the countryCode the platform
    // thinks we are in), but we can check the values are correct given reality.
    let probeUSMismatched, probeNonUSMismatched;
    switch (Services.appinfo.OS) {
      case "Darwin":
        probeUSMismatched = "SEARCH_SERVICE_US_COUNTRY_MISMATCHED_PLATFORM_OSX";
        probeNonUSMismatched = "SEARCH_SERVICE_NONUS_COUNTRY_MISMATCHED_PLATFORM_OSX";
        break;
      case "WINNT":
        probeUSMismatched = "SEARCH_SERVICE_US_COUNTRY_MISMATCHED_PLATFORM_WIN";
        probeNonUSMismatched = "SEARCH_SERVICE_NONUS_COUNTRY_MISMATCHED_PLATFORM_WIN";
        break;
      default:
        break;
    }

    if (probeUSMismatched && probeNonUSMismatched) {
      let countryCode = Services.sysinfo.get("countryCode");
      print("Platform says the country-code is", countryCode);
      let expectedResult;
      let hid;
      // We know geoip said AU - if the platform thinks US then we expect
      // probeUSMismatched with true (ie, a mismatch)
      if (countryCode == "US") {
        hid = probeUSMismatched;
        expectedResult = {0: 0, 1: 1, 2: 0}; // boolean probe so 3 buckets, expect 1 result for |1|.
      } else {
        // We are expecting probeNonUSMismatched with false if the platform
        // says AU (not a mismatch) and true otherwise.
        hid = probeNonUSMismatched;
        expectedResult = countryCode == "AU" ? {0: 1, 1: 0} : {0: 0, 1: 1, 2: 0};
      }

      let histogram = Services.telemetry.getHistogramById(hid);
      let snapshot = histogram.snapshot();
      deepEqual(snapshot.values, expectedResult);
    }
    do_test_finished();
    run_next_test();
  });
  do_test_pending();
}
