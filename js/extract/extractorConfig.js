export default
{
	"source": "rev_jazz",
	"listing": {
		"job_listing": {
			"__selector": {
				"value": "//li[@class='list-group-item']",
				"mode": "xpath"
			},
			"posting_url": {
				"value": "//a/@href",
				"mode": "xpath"
			},
			"job_title": {
				"value": "//a",
				"mode": "xpath"
			},
			"category": {
				"value": "//li[2]",
				"mode": "xpath"
			},
			"location": {
				"value": "//ul[@class='list-inline list-group-item-text']/li[1]",
				"mode": "xpath"
			}
		}
	},
	"job": {
		"job_title": {
			"value": "//h1",
			"mode": "xpath"
		},
		"location": {
			"value": "//li[@title='Location']",
			"mode": "xpath"
		},
		"category": {
			"value": "//li[@title='Department']",
			"mode": "xpath"
		},
		"job_type": {
			"value": "//li[@title='Type']",
			"mode": "xpath"
		},
		"job_level": {
			"value": "//li[@title='Experience']",
			"mode": "xpath"
		},
		"description": {
			"value": "//div[@id='job-description']",
			"mode": "xpath.innerhtml"
		}
	}
}
