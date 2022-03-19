// Globals
USERNAME = ""
// PRIMARY_URL ="http://localhost:8000/"
PRIMARY_URL = "https://qrcode-logistics-app.herokuapp.com/"
// Adding Event Listeners
document.getElementById("main-icon").addEventListener("click",loginUser)
document.getElementById("form-submit-button").addEventListener("click",submitForm)

cookieCheck()

async function cookieCheck(message="Please Login"){
    if (document.cookie.includes("username=")) {
        const cookiesArray = document.cookie.split(";")
        cookiesArray.forEach(cookie => {
            if (cookie.includes("username=")){
                USERNAME = cookie.replace("username=","").trim()
            }
        })
        loadingAnimationToggle()
        await checkData()
        loadingAnimationToggle()
      document.getElementById("user-code").value = USERNAME
      document.getElementById("main-details-form").style.maxHeight = "99999px"
      
    }
    else{
        document.getElementById("main-details-form").style.maxHeight = "0px"
        alert (message)
    }
}

// All Functions
// User Login
async function loginUser(){
    const username = document.getElementById("user-code").value.toString()
    const url = PRIMARY_URL + "login/" + username
    loadingAnimationToggle()
    const loginResponse = await webAppCalls(url)
    loadingAnimationToggle()
    await cookieCheck(loginResponse.response)  
}

// Data Calls
async function checkData(){
    const qrid = window.location.pathname.replace("/","").trim()
    const url = PRIMARY_URL + "qrscan/" + qrid
    const response = await webAppCalls(url)
    console.log(response.results)
    if(response.results.length !== 0){
        await editOldItemSetup(response.results[0])
    }
}

async function editOldItemSetup(previousDetails){
    document.getElementById("information-section-header").innerHTML = "EDIT PREVIOUS ENTRY"
    const previousEntryData = previousDetails.properties
    console.log(previousEntryData)
    const forAlert_editCode = deconstruct(previousEntryData,"Edit Code").length !== 0 ? deconstruct(previousEntryData,"Edit Code")[0]['plain_text'] : "NO EDITS"
    const metaDetails = `Entry Code: ${deconstruct(previousEntryData,"Entry Code")[0]['plain_text']}: ${utcToIst(deconstruct(previousEntryData,"Added Date"))}\nEdit Code: ${forAlert_editCode}: ${utcToIst(deconstruct(previousEntryData,"Last Edited Date"))}`
    window.alert(metaDetails)
    // Modifying values in the form
    document.getElementsByName("floor-number")[0].value = deconstruct(previousEntryData,"Floor Number")[0]['plain_text']
    document.getElementsByName("mode")[0].value = deconstruct(previousEntryData,"Mode")['name']
    deconstruct(previousEntryData,"Category").forEach(category => {
        document.getElementsByName(category["name"])[0].checked = true
    })
    document.getElementsByName("contents")[0].value = deconstruct(previousEntryData,"Contents")[0]['plain_text']
    document.getElementsByName("fragile")[0].checked = deconstruct(previousEntryData, "Fragile")
    document.getElementsByName("truck-orientation")[0].value = deconstruct(previousEntryData,"Truck Orientation")['name']
    document.getElementsByName("status")[0].value = deconstruct(previousEntryData,"Status")['name']
    document.getElementsByName("destination")[0].value = deconstruct(previousEntryData,"Destination")['name']
    document.getElementsByName("destination-details")[0].value = deconstruct(previousEntryData,"Destination Details")[0]['plain_text']
}

// Submit Form
async function submitForm(){
    const checkValidationValue = checkValidation()
    if (checkValidationValue !== "OK"){
        return
    }
    loadingAnimationToggle()
    const submitType = await checkDataPreSub()
    const propertiesData = propertiesObjectGenerator(submitType)
    const action = submitType==0 ? "addNew" : "editOld"
    const url = PRIMARY_URL + "qrscan/" + action
    const response = await webAppCalls(url,"POST", propertiesData)
    loadingAnimationToggle()
    window.alert("Submission Successful!")    
    location.reload()  
}

// Submission pre check
async function checkDataPreSub(){
    const qrid = window.location.pathname.replace("/","").trim()
    const url = PRIMARY_URL + "qrscan/" + qrid
    const response = await webAppCalls(url)
    return response.results.length 
}

// Check Validation
function checkValidation(){
    const val_QRCID = window.location.pathname.replace("/","").trim()
    const val_FloorNumber = document.getElementsByName("floor-number")[0].value
    const val_Mode = document.getElementsByName("mode")[0].value
    var val_Category = []
    var temp_category_array = document.getElementsByClassName("category-cb")
    Array.prototype.forEach.call(temp_category_array, function(category) {
        if(category.checked){
            val_Category.push(category.name)
        }
    })
    const val_Contents = document.getElementsByName("contents")[0].value
    const val_Fragile = document.getElementsByName("fragile")[0].checked
    const val_TruckOrientation = document.getElementsByName("truck-orientation")[0].value
    const val_Status = document.getElementsByName("status")[0].value
    const val_Destination = document.getElementsByName("destination")[0].value
    const val_DestinationDetails = document.getElementsByName("destination-details")[0].value
    if(
            val_QRCID == ''
        || val_FloorNumber == ''
        || val_Mode  == ''
        || val_Category  == ''
        || val_Contents  == ''
        || val_TruckOrientation  == ''
        || val_Status  == ''
        || val_Destination  == ''
        || val_DestinationDetails == ''
    ){
        window.alert("Fields Cannot Be Empty!")
        return ("VALIDATION FAIL")
    }
    return ("OK")
}


// Web App Calls
async function webAppCalls(url,method="GET",query={}){
  if(method == 'GET'){
      const respval = await fetch(url)
      .then(res => res.json())
      .then(resp => {
          return resp
      })
      .catch(error => console.log("Error: " + error))
      return respval
  }
  if(method == "POST"){
      const respval = await fetch(url,{
          method: 'POST',
          headers: {'Content-Type' : 'application/json'},
          body: JSON.stringify(query)
      })
      .then(res => res.json())
      .then(resp => {
          return resp
      })
      .catch(error => console.log("Error: " + error))
      return respval
  }
}

// Properties Object Generator
function propertiesObjectGenerator(submitType){
    const submitCode = usernameCookie()
    const val_QRCID = window.location.pathname.replace("/","").trim()
    const val_FloorNumber = document.getElementsByName("floor-number")[0].value
    const val_Mode = document.getElementsByName("mode")[0].value
    var val_Category = []
    var temp_category_array = document.getElementsByClassName("category-cb")
    Array.prototype.forEach.call(temp_category_array, function(category) {
        if(category.checked){
            val_Category.push(category.name)
        }
    })
    const val_Contents = document.getElementsByName("contents")[0].value
    const val_Fragile = document.getElementsByName("fragile")[0].checked
    const val_TruckOrientation = document.getElementsByName("truck-orientation")[0].value
    const val_Status = document.getElementsByName("status")[0].value
    const val_Destination = document.getElementsByName("destination")[0].value
    const val_DestinationDetails = document.getElementsByName("destination-details")[0].value
    const propertiesObject = {
        "DestinationDetails": val_DestinationDetails,
        "Fragile": val_Fragile,
        "TruckOrientation": val_TruckOrientation,
        "Category": val_Category,
        "Destination":val_Destination,
        "Contents": val_Contents,
        "FloorNumber": val_FloorNumber,
        "Status": val_Status,
        "Mode":val_Mode,
        "QRCID": val_QRCID
    }
    if(submitType == 0){
        propertiesObject["EntryCode"] = submitCode
    }
    else{
        propertiesObject["EditCode"] = submitCode
    }
    return propertiesObject    
}

// Loading Animation Toggle
function loadingAnimationToggle(){
    if (document.getElementById("main-icon").className.includes(" loading")){
        document.getElementById("main-icon").className = document.getElementById("main-icon").className.replace(" loading","")
    }
    else{
        document.getElementById("main-icon").className = document.getElementById("main-icon").className + " loading"
    }
}

// Response Deconstructor
function deconstruct(properties,property){
    return properties[property][properties[property]['type']]
}

// Convert UTC to readable date and time
function utcToIst(dateValue){
    const date = new Date(dateValue)
    return `${pad(date.getDate(),2)}-${pad(date.getMonth()+1,2)}-${date.getYear()+1900} ${pad(date.getHours(),2)}:${pad(date.getMinutes(),2)}`  
}

// Zeropad for max 10 digits
function pad(num,size){
    const s = "000000000"+num
    return s.substring(s.length-size)  
}

// Get username cookie
function usernameCookie(){
    var username = ""
    const cookiesArray = document.cookie.split(";")
    cookiesArray.forEach(cookie => {
        if (cookie.includes("username=")){
            username = cookie.replace("username=","").trim()
        }
    })
    return username
}