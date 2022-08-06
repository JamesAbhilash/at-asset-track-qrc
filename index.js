require("dotenv").config()
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const path = require("path")
const PORT = process.env.PORT || 8000
const express = require("express")
const axios = require("axios")

const app = express()
app.set("view engine", "pug")
app.use(express.static("public"))
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

// Authirized Users
const authorizedUsers = [
  "9573784242_1234",
  "9866074207_1213",
  "9866706524_0102"
]

// Notion data
const { Client } = require("@notionhq/client")

const notion = new Client({ auth: process.env.NOTION_KEY })

const databaseId = process.env.NOTION_DATABASE_ID

app.get("/", async (req, res) => {
  res.json(`Welcome to the QR CODE APP.`)
})

app.get("/login/:username", loginUser, async(req,res) => {
  res.json(req.response)
})

app.get("/:qrid", async (req, res) => {
  res.sendFile("index.html", { root: path.join(__dirname, "public/views") })
})

app.get("/qrscan/:qrid", authUser, filterObjectGenerator, async (req, res) => {
  const response = await getItem(req.body.filterObject)
  res.json(response)
})

app.post("/qrscan/:action", authUser, itemObjectGenerator, filterObjectGenerator, async (req, res) => {
    if (req.params.action == "addNew") {
      const response = await addNewItem(req.body.itemObject)
      res.json(response)
    }
    else if (req.params.action == "editOld") {
      const filteredResult = await getItem(req.body.filterObject)
      if (filteredResult.results.length == 0) {
        const response = {}
        res.json(response)
      }
      else {
        const pageId = filteredResult.results[0]["id"]
        const response = await editOldItem(req.body.itemObject, pageId)
        res.json(response)
      }
    }

    // res.json(`The main page where you get the qrid information if it exists and perhaps provide options to edit if needed`)
  }
)

app.listen(PORT, () => console.log(`Server is running on PORT: ${PORT}`))

function loginUser(req, res, next){
  if(authorizedUsers.includes(req.params.username)){
    res.cookie('username',req.params.username,{
      maxAge:3600000
    })
    req.response = {"response": "AUTHORIZED"}
  }
  else{
    res.clearCookie('username')
    req.response = {"response": "ACCESS DENIED"}
  }
  next()
}

function authUser(req, res, next){
  const frontEndUser = req.cookies.username
  if(!authorizedUsers.includes(frontEndUser)){
    res.clearCookie('username')
    return res.sendFile("index.html", { root: path.join(__dirname, "public/views") })
  }
  next()
}

function itemObjectGenerator(req, res, next) {
  const requestBody = req.body
  var templateObject = {
    "Photo": {
      id: "%3FF%5CR",
      type: "checkbox",
      checkbox: requestBody["Photo"],
    },
    "Item": {
      id: "ELMv",
      type: "select",
      select: {
        name: requestBody["Item"],
      },
    },
    "Category": {
      id: "EZ%60U",
      type: "select",
      select: {
        name: requestBody["Category"],
      },
    },
    "Action": {
      id: "%5CXtx",
      type: "select",
      select: {
        name: requestBody["Action"],
      },
    },
    "Remarks": {
      id: "%5EPe%60",
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: {
            content: requestBody["Remarks"],
            link: null,
          },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: "default",
          },
          plain_text: requestBody["Remarks"],
          href: null,
        },
      ],
    },
    "Floor Number": {
      id: "wwyY",
      type: "select",
      select: {
        name: requestBody["FloorNumber"],
      },
    },
    "Sub Category": {
      id: "%7D%3Dev",
      type: "select",
      select: {
        name: requestBody["SubCategory"],
      },
    },
    "Room": {
      id: "%3B%3AsT",
      type: "select",
      select: {
        name: requestBody["Room"],
      },
    },
    "QRCID": {
      id: "title",
      type: "title",
      title: [
        {
          type: "text",
          text: {
            content: requestBody["QRCID"],
            link: null,
          },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: "default",
          },
          plain_text: requestBody["QRCID"],
          href: null,
        },
      ],
    },
  }

  if(requestBody["EntryCode"] !== undefined){
    templateObject["Entry Code"] = {
      id: "ZwKV",
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: {
            content: requestBody["EntryCode"],
            link: null,
          },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: "default",
          },
          plain_text: requestBody["EntryCode"],
          href: null,
        },
      ],
    }
  }
  if(requestBody["EditCode"] !== undefined){
    templateObject["Edit Code"] = {
      id: "fZgh",
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: {
            content: requestBody["EditCode"],
            link: null,
          },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: "default",
          },
          plain_text: requestBody["EditCode"],
          href: null,
        },
      ],
    }
  }

  req.body.itemObject = templateObject
  req.params.qrid = requestBody["QRCID"]
  next()
}

function filterObjectGenerator(req, res, next) {
  const requestID = req.params.qrid
  const templateObject = {
    property: "QRCID",
    title: {
      equals: requestID,
    },
  }
  req.body.filterObject = templateObject
  next()
}

function multiSelectObjectGenerator(multiSelectArray = []) {
  const multiSelectObject = []
  multiSelectArray.forEach((option) => {
    multiSelectObject.push({ name: option })
  })
  return multiSelectObject
}

async function addNewItem(propertiesObject) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: propertiesObject,
    })
    console.log(response)
    return response
  } catch (error) {
    console.error(error.body)
  }
}

async function getItem(filterObject) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: filterObject,
    })
    console.log(response)
    return response
  } catch (error) {
    console.error(error.body)
  }
}

async function editOldItem(propertiesObject, pageId) {
  try {
    const response = await notion.pages.update({
      page_id: pageId,
      database_id: databaseId,
      properties: propertiesObject,
    })
    console.log(response)
    return response
  } catch (error) {
    console.error(error.body)
  }
}
