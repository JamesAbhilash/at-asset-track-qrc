// Globals
USERNAME = ""
// **DEV SECTION BEGIN
PRIMARY_URL ="http://192.168.29.114:8000/"
// PRIMARY_URL ="http://localhost:8000/"
// **DEV SECTION END

// **PROD SECTION BEGIN
// PRIMARY_URL = "https://qrcode-asset-tracking.herokuapp.com/"
// **PROD SECTION END


// Adding Event Listeners
document.getElementById("main-icon").addEventListener("click",loginUser)
document.getElementById("form-submit-button").addEventListener("click",submitForm)
document.getElementsByName("item")[0].addEventListener("change",itemSubCategoryListGenerator)

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
    else {
        await onNewLoadRuns()
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
    document.getElementsByName("floor-number")[0].value = deconstruct(previousEntryData,"Floor Number")['name']
    document.getElementsByName("room")[0].value = deconstruct(previousEntryData,"Room")['name']
    const category_selected = deconstruct(previousEntryData,"Category")['name']
    document.getElementsByName("category").forEach(category_element => {
        if(category_selected==category_element.value){
            category_element.checked = true
        }
    })
    document.getElementsByName("remarks")[0].value = deconstruct(previousEntryData,"Remarks")[0]['plain_text']
    document.getElementsByName("photo")[0].checked = deconstruct(previousEntryData, "Photo")
    document.getElementsByName("item")[0].value = deconstruct(previousEntryData,"Item")['name']
    // Running linked list generator for sub category dropdown list immediately after item gets populated
    itemSubCategoryListGenerator()
    document.getElementsByName("sub-category")[0].value = deconstruct(previousEntryData,"Sub Category")['name']
    document.getElementsByName("action")[0].value = deconstruct(previousEntryData,"Action")['name']
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
    const val_Room = document.getElementsByName("room")[0].value
    var val_Category
    document.getElementsByName("category").forEach(category_element => {
        if(category_element.checked){
            val_Category = category_element.value
        }
    })
    // var val_Category = []
    // var temp_category_array = document.getElementsByClassName("category-cb")
    // Array.prototype.forEach.call(temp_category_array, function(category) {
    //     if(category.checked){
    //         val_Category.push(category.name)
    //     }
    // })
    const val_Remarks = document.getElementsByName("remarks")[0].value
    const val_Photo = document.getElementsByName("photo")[0].checked
    const val_Item = document.getElementsByName("item")[0].value
    const val_SubCategory = document.getElementsByName("sub-category")[0].value
    const val_Action = document.getElementsByName("action")[0].value
    if(
           val_QRCID == ''
        || val_FloorNumber == ''
        || val_Room  == ''
        || val_Category  == ''
        || val_Remarks  == ''
        || val_Item  == ''
        || val_SubCategory  == ''
        || val_Action  == ''
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
    const val_Room = document.getElementsByName("room")[0].value
    var val_Category
    document.getElementsByName("category").forEach(category_element => {
        if(category_element.checked){
            val_Category = category_element.value
        }
    })
    // var val_Category = []
    // var temp_category_array = document.getElementsByClassName("category-cb")
    // Array.prototype.forEach.call(temp_category_array, function(category) {
    //     if(category.checked){
    //         val_Category.push(category.name)
    //     }
    // })
    const val_Remarks = document.getElementsByName("remarks")[0].value
    const val_Photo = document.getElementsByName("photo")[0].checked
    const val_Item = document.getElementsByName("item")[0].value
    const val_SubCategory = document.getElementsByName("sub-category")[0].value
    const val_Action = document.getElementsByName("action")[0].value
    const propertiesObject = {
        "Photo": val_Photo,
        "Item": val_Item,
        "Category": val_Category,
        "Action":val_Action,
        "Remarks": val_Remarks,
        "FloorNumber": val_FloorNumber,
        "SubCategory": val_SubCategory,
        "Room":val_Room,
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

// Dynaminc Dropdown Linked List generators
// Sub Category list generator. Generates array and adds elements to the dom
function itemSubCategoryListGenerator(){
    const elm_Item = document.getElementsByName("item")[0]
    const elm_SubCategory = document.getElementsByName("sub-category")[0]
    elm_SubCategory.innerHTML = ''

    const elm_SubCategory_0 = document.createElement('option')
    elm_SubCategory_0.value = ''
    elm_SubCategory_0.innerText = 'Sub Category'
    
    elm_SubCategory.appendChild(elm_SubCategory_0)

    if(elm_Item.value !== null && elm_Item.value !== ''){
        itemCategory[elm_Item.value]['itemSubCategoryArray'].forEach(subCategory =>{
            var elm_SubCategory_n = document.createElement('option')
            elm_SubCategory_n.value = subCategory
            elm_SubCategory_n.innerText = subCategory
            elm_SubCategory.appendChild(elm_SubCategory_n)
        })
    }   
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

// On load runs
async function onNewLoadRuns(){
    // Dynamic drop down list generator for sub category
    itemSubCategoryListGenerator()
}