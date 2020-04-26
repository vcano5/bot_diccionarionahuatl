require('dotenv').config();

const express = require('express'),
	app = express(),
	MongoClient = require('mongodb').MongoClient,
	bodyParser = require('body-parser'),
	crypto = require('crypto');

var url = process.env.MONGO_URL;

const client = new MongoClient(url);

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.listen((process.env.PORT || 3001), function() {
	console.log('Puerto: ', process.env.PORT || 3001);
})

client.connect(function(err, client) {
	if(err) throw err;
	console.log('Conectado correctamente al servidor');
	const db = client.db('datos');

	function responseText(texto) {
		return ({messages: [{text: texto}]})
	}

	function responseImage(urle) {
		return ({messages:[{attachment:{type:"image",payload:{url: urle}}}]});
	}

	function responseVideo(urle) {
		return ({messages:[{attachment:{type:"video", payload: {url: urle}}}]});
	}

	function responseGallery(galeria) {
		var respuesta = {messages: [{attachment: {type: "template", payload: {template_type: "generic", image_aspect_ratio: "horizontal", elements:[]}}}]}
		//console.log(respuesta['messages'][0]['attachment']['payload']['elements'])
		for(var i = 0; i < galeria.length; i++) {
			respuesta['messages'][0]['attachment']['payload']['elements'][i] = {title: (galeria[i].espanol || galeria[i].frase), subtitle: ('Nahuatl: ' + galeria[i].nahuatl + ' \u000AMatricula: ' + galeria[i].matricula), image_url: ('https://dummyimage.com/1920x1080/fff/000000.png&text=' + (galeria[i].espanol || galeria[i].frase)), buttons: [{type: "web_url", url: ("https://nahuatl.vcano5.com/clave?c=" + galeria[i].clave), title:"VER MAS", webview_height_ratio: "tall"}]}
		}
		//console.log(respuesta['messages'][0]['attachment']['payload']['elements'])
		return respuesta;
	}

	function responseAudio(urle) {
		return ({messages: [{attachment: {type:"audio", payload: {url: urle}}}]});
	}

	app.get('/', function(req, res) {
		res.send("Fierro")
	})

	var imagen = "https://image.flaticon.com/icons/svg/207/207127.svg";

	app.get('/getPalabras', function(req, res) {
		db.collection('nahuatl').find({frase: ''}).limit(5).toArray(function(err, r) {
			if(err) throw err;
			res.json(r)
		})
	})

	app.get('/buscar', function(req, res) {
		var x = db.collection('nahuatl');
		var rg = new RegExp(req.query.b, 'gi');
		if(req.query.tipo == 'espanol') {
			x.find({espanol: rg}).toArray(function(err, r) {
				if(err) throw err;
				if(r.length > 0) {
					res.json(responseGallery(r));
				}
				else {
					res.json(responseText('No encontre resultados para la busqueda.'))
				}
			})
		}
		else if(req.query.tipo == 'frase') {
			x.find({frase: rg}).toArray(function(err, r) {
				if(err) throw err;
				if(r.length > 0) {
					res.json(responseGallery(r))
				}
				else {
					res.json(responseText('No encontre resultados para la busqueda'))
				}
			})
		}
		else if(req.query.tipo == 'matricula') {
			x.find({matricula: req.query.b}).toArray(function(err, r) {
				if(err) throw err;
				if(r.length > 0) {
					var galeria = r;
					var respuesta = {messages: [{},{attachment: {type: "template", payload: {template_type: "generic", image_aspect_ratio: "horizontal", elements:[]}}}]}
					//console.log(respuesta['messages'][0]['attachment']['payload']['elements'])
					if(galeria.length < 9) {
						for(var i = 0; i < galeria.length; i++) {
							respuesta['messages'][1]['attachment']['payload']['elements'][i] = {title: (galeria[i].espanol || galeria[i].frase), subtitle: ('Nahuatl: ' + galeria[i].nahuatl + ' \u000AMatricula: ' + galeria[i].matricula), image_url: ('https://dummyimage.com/1920x1080/fff/000000.png&text=' + (galeria[i].espanol || galeria[i].frase)), buttons: [{type: "web_url", url: ("https://nahuatl.vcano5.com/clave?c=" + galeria[i].clave), title:"VER MAS", webview_height_ratio: "tall"}]}
						}
						respuesta['messages'][0] = {text: "Resultados para la busqueda. \nMatricula " + req.query.b}
						//respuesta['messages'][1] = {text: "Nombre: " + }
						res.json(respuesta)
					}
					else {
						//respuesta['messages'][1]['attachment']['payload']['elements'][0] = {title: "Resultados para la busqueda", subtitle: 'Matricula: ' + req.query.b, image_url: ('https://dummyimage.com/1920x1080/fff/000000.png&text=' + galeria.length + '%20resultados'), buttons: [{type: "web_url", url: ("https://nahuatl.vcano5.com/publicaciones?matricula=" + req.query.b), title:"EXPLORAR TODO", webview_height_ratio: "tall"}]}
						for(var i = 0; i < 9; i++) {
							respuesta['messages'][1]['attachment']['payload']['elements'][i] = {title: (galeria[i].espanol || galeria[i].frase), subtitle: ('Nahuatl: ' + galeria[i].nahuatl + ' \u000AMatricula: ' + galeria[i].matricula), image_url: ('https://dummyimage.com/1920x1080/fff/000000.png&text=' + (galeria[i].espanol || galeria[i].frase)), buttons: [{type: "web_url", url: ("https://nahuatl.vcano5.com/clave?c=" + galeria[i].clave), title:"VER MAS", webview_height_ratio: "tall"}]}
						}
						respuesta['messages'][0] = {text: galeria.length + " resultados para la busqueda. \nMatricula " + req.query.b}
						//respuesta['messages'][1] = {text: "Nombre: " + }
						respuesta['messages'][1]['attachment']['payload']['elements'][9] = {title: "Resultados para la busqueda", subtitle: 'Matricula: ' + galeria[i].matricula, image_url: ('https://dummyimage.com/1920x1080/fff/000000.png&text=' + (galeria.length - 9) + '%20resultados%20más'), buttons: [{type: "web_url", url: ("https://nahuatl.vcano5.com/publicaciones?matricula=" + req.query.b), title:"EXPLORAR TODO", webview_height_ratio: "tall"}]}
						res.json(respuesta)
					}
					/*for(var i = 0; i < galeria.length; i++) {
						respuesta['messages'][1]['attachment']['payload']['elements'][i] = {title: (galeria[i].espanol || galeria[i].frase), subtitle: ('Nahuatl: ' + galeria[i].nahuatl + ' \u000AMatricula: ' + galeria[i].matricula), image_url: ('https://dummyimage.com/1920x1080/fff/000000.png&text=' + (galeria[i].espanol || galeria[i].frase)), buttons: [{type: "web_url", url: ("https://nahuatl.vcano5.com/clave?c=" + galeria[i].clave), title:"VER MAS", webview_height_ratio: "tall"}]}
					}
					respuesta['messages'][0] = {text: "Resultados para la busqueda. \nMatricula " + req.query.b}
					//respuesta['messages'][1] = {text: "Nombre: " + }
					res.json(respuesta)*/
				}
				else {
					res.json(responseText('No encontre resultados para la busqueda'))
				}
			})
		}
		else if(req.query.tipo == 'nahuatl') {
			x.find({nahuatl: rg}).toArray(function(err, r) {
				if(err) throw err;
				if(r.length > 0) {
					res.json(responseGallery(r))
				}
				else {
					res.json(responseText('No encontre resultados para la busqueda.'))
				}
			})
		}
		else {
			res.json(responseText('Intenta de nuevo. ERROR: NF_Q_tipo=' + req.query.tipo + "+" + rg))
		}
	})

	app.get('/galeria', function(req, res) {
		var limite = (req.query.limite || 10);
		if(limite > 10) {
			res.json(responseText('El limite es 10 publicaciones por consulta'))
		}
		else {
			if(req.query.tipo == "palabras") {
				r = Math.floor(Math.random() * 735)
				db.collection('nahuatl').find({frase: ''}).limit(10).skip(r).toArray(function(err, r) {
					if(err) throw err;
					res.json(responseGallery(r))
				})
			}
			else {
				r = Math.floor(Math.random() * 178) 
				db.collection('nahuatl').find({espanol: ''}).limit(10).skip(r).toArray(function(err, r) {
					if(err) throw err;
					res.json(responseGallery(r))
				})
			}
		}
	})

	app.get('/mispublicaciones', function(req, res) {
		if(req.query.matricula == '3.14' || req.query.matricula == '3.1416') {
			res.json(responseText('No tienes matricula asociada.'))
		}
		else {
			if(req.query.tipo == "palabras") {
				db.collection('nahuatl').find({matricula: req.query.matricula}).limit(10).toArray(function(err, r) {
					if(err) throw err;
					if(r.length > 0) {
						res.json(responseGallery(r))
					}
					else {
						res.json(responseText('Aun no has aportado palabras.'))
					}
				})
			}
			else {
				db.collection('nahuatl').find({matricula: req.query.matricula}).limit(10).toArray(function(err, r) {
					if(err) throw err;
					if(r.length > 0) {
						res.json(responseGallery(r))
					}
					else {
						res.json(responseText('Aun no has aportado frases :('))
					}
				})
			}
		}
	})

	function randomID(size) {
		charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		var randomString = '';
		for(var i = 0; i < size; i++) {
			var randomPoz = Math.floor(Math.random() * charSet.length);
			randomString += charSet.substring(randomPoz, randomPoz + 1);
		}
		return randomString;
	}

	function passGenerator(pass) {
		return crypto.createHmac('sha256', 'tamarindo')
				.update(pass)
				.digest('hex')
	}

	app.get('/DesvincularMatricula', function(req ,res) {
		db.collection('usuarios').updateOne({matricula: req.query.matricula}, {$set: {fb_id: ''}}, function(err, r) {
			if(err) throw err;
			if(r.matchedCount > 0) {
				var respuesta = {messages: [{texto: "Desvincule tu cuenta correctamente"}], redirect_to_blocks: ["registro"]}
				res.json(respuesta);
			}
		})
	})

	app.get('/siTengoCuenta', function(req, res) {
		db.collection('usuarios').find({nombre: req.query.nombre}).toArray(function(err, resu) {
			if(err) throw err;
				if(resu[0].fb_id == req.query.fb_id) {
				console.log('Si existe')
				var respuesta = {set_attributes: {matricula: resu[0].matricula}, messages:[]}
				respuesta['messages'][0] = {text: ("Encontre tu cuenta! Creo que tu matricula es: " + resu[0].matricula), quick_replies: [{title:"Si, es correcto",
	          block_names: ["configuracionInicialPosts"]}, {title:"No", block_names: ["DesvincularMatricula"]}]}
	          console.log(respuesta)
				res.json(respuesta)
			}
			else {
				var respuesta = {messages: [], redirect_to_blocks: ["hablar"]}
				var correcto = {text: "Tu cuenta no esta asociada a Facebook Messenger"}
				var redireccionamiento = {text: "Por favor envia un correo electronico a al195352@alumnos.uacj.mx para recibir soporte prioritario"}
				var espera = {text: "O si prefieres esperara aqui "}
				respuesta['messages'][0] = correcto;
				respuesta['messages'][1] = redireccionamiento;
				respuesta['messages'][2] = espera;
				res.json(respuesta)
			}
		})
	})

	app.get('/register', function(req, res) {
		db.collection('usuarios').find({matricula: req.query.matricula}).toArray(function(err, resultado) {
			if(err) throw err;
			if(resultado.length > 0) {
				var respuesta = {messages: [], set_attributes: {matricula: req.query.matricula}}
				if(req.query.fb_id == resultado[0].fb_id) {
					respuesta.messages[0] = {text: ("Encontre tu cuenta! Quieres reestablecer tu contraseña?"), quick_replies: [{title:"Si", block_names: ["cambiarContraseña"]}, {title:"No", block_names: ["Default Answer"]}]}
					res.json(respuesta)
				}
				else {
					respuesta.messages[0] = {text: "La matricula ya se encuentra asociada a otra cuenta."}
					respuesta.redirect_to_blocks = ["hablar"];
					respuesta.messages[1] = {text: "En un momento un administrador te ayudara"}
					res.json(respuesta)
				}
				
				//res.json(responseText('La matricula ya se encuentra asociada a otra cuenta'))
			}
			else {
				var jotason = req.query
				var uuid = randomID(64);
				var contrasenaaa = passGenerator(req.query.password);
				jotason.contrasena = contrasenaaa;
				jotason.normal = req.query.password;
				jotason.uuid = uuid;
				db.collection('usuarios').insertOne(jotason, function(err, r) {
					if(err) throw err;
					var respuesta = {messages: [], redirect_to_blocks: ["cambiarContraseña"]}
					respuesta.messages[0] = {text: "El registro fue exitoso, por favor cambia tu contraseña ahora."}
					res.json(respuesta)
					//res.json(responseText('El registro fue exitoso, por favor cambia tu contraseña ahora en la aplicacion.'))
				})
			}
		})
	})

	app.get('/generarToken', function(req, res) {
		var token = randomID(16);
		db.collection('usuarios').updateOne({fb_id: req.query.fb_id}, {$set: {last_token: token}}, function(err, r) {
			if(err) throw err;
			if(r.matchedCount > 0) {
				var respuesta = {messages: [{attachment: {type: "template", payload: {template_type: "generic", image_aspect_ratio: "horizontal", elements:[{title: "Configura tu contraseña ahora", subtitle: 'https://nahuatl.vcano5.com/' , image_url: 'https://dummyimage.com/475x250/fff/000000.png&text=Cambiar%20contraseña', buttons: [{type: "web_url", url: ("https://nahuatl.vcano5.com/configurarContrasena?fb_id=" + req.query.fb_id + '&last_token=' + token), title:"CONFIGURAR AHORA", webview_share_button: "hide"}]}]}}}]} 
				res.json(respuesta)
			}
		})
	})

	app.get('/vincular', function(req, res) {
		db.collection('nahuatl').find({temp_token: req.query.token.toUpperCase()}).toArray(function(err, r) {
			if(err) throw err;
			if(r.length > 0) {
				db.collection('nahuatl').updateOne({temp_token: req.query.token.toUpperCase}, {$set: {fb_id: req.query.fb_id}}, function(errr, rr) {
					if(errr) throw errr;
					if(rr.matchedCount > 0) {
						var respuesta = {messages: [], redirect_to_blocks: ["configuracionInicialPosts"], set_attributes: {matricula: r[0].matricula}}
						var correcto = {text: "Has vinculado tu cuenta de Facebook correctamente"}
						respuesta['messages'][0] = correcto;
						res.json(respuesta)
					}
				})
			}
			else {
				res.json(responseText('Tu token no es valido, por favor genera uno nuevo en https://nahuatl.vcano5.com/login'))
			}
		})
	})
})