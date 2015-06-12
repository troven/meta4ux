package todo.v1.code.install.strata.user

def models =
[
  [
	"id": "owner",
	 "firstname": "Strata",
	 "lastname": "Administrator",
	 "job_title": "Strata Owner",
	 "email": "support@Meta4Beta.com",
	 "registrationType": "demo"
  ],
  [
	"id": "meta4principals:1",
	 "firstname": "Demo",
	 "lastname": "Leader",
	 "job_title": "Team Leader",
	 "email": "leader@example.com",
	 "registrationType": "demo"
  ],
  [
	"id": "meta4principals:2",
	 "firstname": "Demo",
	 "lastname": "Manager",
	 "job_title": "Project Manager",
	 "email": "manager@example.com",
	 "registrationType": "demo"
  ]
]

log.debug("Installing Users: "+models)
