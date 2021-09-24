/**
 * 部门权限-部门列表
 * Created by wrb on 2019/8/1.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_role_org",
        defaults = {
            role:null,//角色对象
            saveCallBack:null//操作保存回调
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this._dataList = [];//当前人员列表
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        },
        render: function () {
            var that = this;
            var option = {};
            option.url=restApi.url_listChildCompany;
            option.postData = {
                roleId:that.settings.role.id
            };
            m_ajax.postJson(option, function (res) {
                if (res.code === '0') {
                    that._dataList = res.data;
                    var html = template('m_role/m_role_org', {dataList:res.data,role:that.settings.role,companyUserId:window.currentCompanyUserId});
                    $(that.element).html(html);
                    that.bindActionClick();
                    that.editHoverFun();
                } else {
                    S_toastr.error(res.info);
                }
            });
        }

        //移交负责人
        , transferSys:function (data) {
            var that = this;
            var options= {};
            options.classId = 'body';
            options.url = restApi.url_transferSys;
            options.postData = {
                userId:data.userId,
                companyId:data.companyId,
                type:2
            };
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){
                    S_toastr.success('操作成功!');
                    that.render();
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        //hover事件
        ,editHoverFun:function ($ele) {

            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element).find('tr');

            //文本移上去出现编辑图标hover事件
            $ele.find('a[data-action="setManager"]').each(function () {

                var $this = $(this);
                $this.closest('TD').hover(function () {
                    $this.css('visibility','visible');
                },function () {
                    $this.css('visibility','hidden');
                })
            });

        }
        //事件绑定
        , bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action],a[data-action]').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action'),dataId = $this.closest('tr').attr('data-id'),dataI = $this.closest('tr').attr('data-i');
                switch (dataAction){
                    case 'setIndependentOrg'://设置成独立机构

                        $('body').m_role_org_change({
                            doType:1,
                            dataInfo:that._dataList[dataI],
                            saveCallBack:function () {
                                that.render();
                            }
                        });

                        break;
                    case 'setDirectDepart'://设置成直属部门

                        $('body').m_role_org_change({
                            doType:0,
                            dataInfo:that._dataList[dataI],
                            saveCallBack:function () {
                                that.render();
                            }
                        });
                        break;
                    case 'changeRole'://变更权限

                        $('body').m_role_org_change({
                            doType:2,
                            dataInfo:that._dataList[dataI],
                            saveCallBack:function () {
                                that.render();
                            }
                        });
                        break;
                    case 'setManager'://设置负责人

                        var systemManagerId = $this.attr('data-id'),systemManager=$this.attr('data-name'),companyId=$this.closest('tr').attr('data-id');
                        var selectedUserList = [];
                        if(!isNullOrBlank(systemManagerId)){
                            selectedUserList.push({id:systemManagerId,userName:systemManager});
                        }

                        var options = {};
                        options.title = '设置负责人';
                        options.treeUrl = restApi.url_getAuditTemplateDepartTree+'/'+companyId;
                        options.isASingleSelectUser = true;
                        options.selectedUserList = selectedUserList;
                        options.isOkSave = false;
                        options.cancelText = '关闭';
                        options.selectUserCallback = function (data,event) {

                            S_layer.confirm('确定将负责人更换为“'+data.userName+'”?',function(){

                                data.companyId = companyId;
                                that.transferSys(data,event);

                            },function(){
                                //S_layer.close($(event));
                            });
                        };

                        $('body').m_orgByTree(options);
                        return false;
                        break;


                }

            })
        }

    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);