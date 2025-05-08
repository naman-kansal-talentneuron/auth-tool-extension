export default
{
    "source": "avon",
    "proxy": {
        "ip": "default",
        "port": ""
    },
    "type": "html",
    "startUrl": "https://recruiting.ultipro.com/NEW1030AVON/JobBoard/5a4508d3-cc8f-3b41-4357-f8827fb4df63/?q=&o=postedDateDesc",
    "payload": [
        {
            "id": "job-list-html",
            "type": "BasicElement",
            "selector": "body",
            "selectorType": "css",
            "persist":true,
			"documentType": "listing",
            "parent": "root"
        },
        {
            "id": "job-list",
            "type": "BasicElement",
            "selector": "//a[@data-automation='job-title']",
            "selectorType": "xpath",
            "fetchType": "eager",
            "multiple": true,
            "parent": "root"
        },
        {
            "id": "posting",
            "type": "LinkElement",
            "selector": "https://recruiting.ultipro.com${macros['job-list']['href']}",
            "selectorType": "provided",
            "parent": "job-list"
        },
        {
            "id": "posting-html",
            "type": "BasicElement",
            "selector": "body",
            "selectorType": "css",
            "persist" : true,
			"documentType": "job",
            "parent": "posting"
        }
    ]
}
