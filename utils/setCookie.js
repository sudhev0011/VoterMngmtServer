const setCookie = (token, res)=>{

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
}

module.exports = setCookie;