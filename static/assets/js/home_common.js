/**
 * Created by wrb on 2019/3/14.
 * 官网
 */
var home_common = {
    _wrapper:'#wrapper',
    init: function () {
        var that = this;

        that.initRoute();
    }
    //路由
    , initRoute:function () {
        var that = this;
        Router.route('/', function() {//
            $('body').m_browser_tips();
            //$('#wrapper').m_website_index({},true);
            $(that._wrapper).m_website_common_login({},true);
        });
        Router.route('/products', function() {//产品
            $(that._wrapper).m_website_products({},true);
        });
        Router.route('/products/details/1', function() {//产品
            $(that._wrapper).m_website_products_details({activeId:1},true);
        });
        Router.route('/products/details/2', function() {//产品
            $(that._wrapper).m_website_products_details({activeId:2},true);
        });
        Router.route('/products/details/3', function() {//产品
            $(that._wrapper).m_website_products_details({activeId:3},true);
        });
        Router.route('/products/details/4', function() {//产品
            $(that._wrapper).m_website_products_details({activeId:4},true);
        });
        Router.route('/pricing', function() {//价格
            $('#wrapper').m_website_pricing({},true);
        });
        Router.route('/tutorial', function() {//产品
            $(that._wrapper).m_website_tutorial({},true);
        });

        /***********************************帮助中心-开始************************************/
        Router.route('/faq', function() {//帮助中心
            $(that._wrapper).m_website_faq({},true);
        });

        if(faq_menu && faq_menu.length>0){
            $.each(faq_menu,function (i,item) {
                if(item.children && item.children.length>0){
                    $.each(item.children,function (ci,citem) {
                        Router.route('/'+citem.id, function() {//帮助中心-进行权限配置
                            $(that._wrapper).m_website_faq({activeId:citem.id},true);
                        });
                    });
                }
            });
        }

        /***********************************帮助中心-结束************************************/


        Router.route('/updateLog', function() {//帮助中心
            $(that._wrapper).m_website_update_log({},true);
        });

        Router.route('/terms', function() {//服务协议
            $(that._wrapper).m_website_terms({},true);
        });
        Router.route('/security', function() {//安全保障
            $(that._wrapper).m_website_security({},true);
        });

        Router.route('/login', function() {//登录
            $(that._wrapper).m_website_common_login({},true);
        });

        Router.route('/register', function() {//注册

            if (window.rootPath.indexOf('www.imaoding.net')>-1){
                window.location.hash = '/';
                return false;
            }
            $(that._wrapper).m_website_common_register({},true);

        });

        Router.route('/forgetLoginPwd', function() {//忘记密码
            $(that._wrapper).m_website_common_forgetpwd({},true);
        });


        Router.route('/error/404', function() {//错误界面
            $(that._wrapper).m_error({},true);
        });

        /******************************* 头部操作路由-结束 *************************************/

        Router.beforeCallback(function (resolve) {

            var url = window.location.href;
            if(url.indexOf('/register')>-1 || url.indexOf('/login')>-1 || url.indexOf('/forgetLoginPwd')>-1){

                $('.website-header').html('');
                $('.website-footer').html('');

            }else{
                //that.renderHeaderFooter();
            }
            resolve('render');
        });
        Router.afterCallback(function () {
            $('html').scrollTop(0);
            //that.menuActive();
        });
    }
    ,menuActive:function () {
        var t = setTimeout(function () {

            if(!isNullOrBlank(Router.currentUrl)){

                var type = Router.currentUrl.substring(1, Router.currentUrl.length);

                if(type.indexOf('/')>-1)
                    type = type.substring(0,type.indexOf('/'));

                var liType = type;
                if(type=='pricing')
                    liType = 'products';

                if(type=='tutorial' || type=='faq')
                    liType = 'service';

                $('.m-website-header ul li a').removeClass('active');
                $('.m-website-header ul li[data-type="'+liType+'"] a.nav-link-bar').addClass('active');
                $('.m-website-header ul li[data-type="'+liType+'"] a[data-type="'+type+'"]').addClass('active');
            }
            clearTimeout(t);
        },100);
    }
    ,renderHeaderFooter:function () {
        var that = this;
        $('.website-header').m_website_header({
            renderCallBack:function () {
                $('#loginBox').m_website_login({},true);
                that.menuActive();
            }
        },true);
        $('.website-footer').m_website_footer({},true);

    }

};
