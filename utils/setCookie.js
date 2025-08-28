const setCookie = (token, res)=>{
    if(token){
      try {
        res.cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        });
      } catch (error) {
        console.log('cookie error:',error)
      }
    }else{
      console.log("no token found for setting cookie")
    }
}

module.exports = setCookie;