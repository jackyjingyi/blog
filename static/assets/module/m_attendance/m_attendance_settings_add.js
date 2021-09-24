/**
 * 考勤-打卡规则
 * Created by wrb on 2018/10/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_attendance_settings_add",
        defaults = {
            id:null//打卡记录ID，编辑情况下，不为空
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._timeInfo = {a:[],b:[]};//a=打卡时间,b=班次
        this._dateMustBePunchedInfo = [];//必须打卡的日期
        this._dateNotMustBePunchedInfo = [];//不用打卡的日期
        this._attendanceUser = {};//打卡人员(1：需要打卡的，2：白名单（不要打卡的），3：汇报对象)
        this._attendanceUserList = [];//打卡人员
        this._arrangeWorkList = [];//排班
        this._addressList = [];//打卡地址设置
        this._wifiList = [];//wifi设置

        this._dataInfo = null;//打卡规则数据记录
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            if(isNullOrBlank(that.settings.id)){//添加
                that.render();
            }else{//编辑
                that.getAttendanceData(function () {
                    that.render();

                    $(that.element).find('input[name="ruleType"]:checked').parent().click();
                    //手机提醒
                    $(that.element).find('select[name="remindTime"]').val(that._dataInfo.remindTime).trigger('change');

                    /*********转为编辑数据格式*********/
                    var getUserList = function (list,key) {
                        that._attendanceUser[key] = [];
                        $.each(list,function (i,item) {
                            that._attendanceUser[key].push({
                                id: item.orgId,
                                text: item.orgName,
                                type: item.type
                            });
                        });
                        return that._attendanceUser[key];
                    };
                    //打卡人员
                    if(that._dataInfo.attendanceUserList!=null && that._dataInfo.attendanceUserList.length>0){
                        var list = getUserList(that._dataInfo.attendanceUserList,'1');
                        that.renderAttendanceUser(list,$(that.element).find('button[data-action="addAttendanceUser"][data-type="1"]'));
                    }
                    //白名单
                    if(that._dataInfo.whiteUserList!=null && that._dataInfo.whiteUserList.length>0){
                        var list = getUserList(that._dataInfo.whiteUserList,'2');
                        that.renderAttendanceUser(list,$(that.element).find('button[data-action="addAttendanceUser"][data-type="2"]'));
                    }
                    //汇报对象
                    if(that._dataInfo.reportToUserList!=null && that._dataInfo.reportToUserList.length>0){
                        var list = getUserList(that._dataInfo.reportToUserList,'3');
                        that.renderAttendanceUser(list,$(that.element).find('button[data-action="addAttendanceUser"][data-type="3"]'));
                    }
                    //打卡地点
                    if(that._dataInfo.addressList!=null && that._dataInfo.addressList.length>0){
                        $.each(that._dataInfo.addressList,function (i,item) {
                            var data = {
                                itemKey: item.id,
                                point: {lat:item.lat,lng:item.lng},
                                address: item.address,
                                punchCardName:item.name,
                                punchRange:item.distance
                            };
                            that._addressList.push(data);
                            that.renderAddressAddData(data);
                        });
                    }
                    //打卡WiFi
                    if(that._dataInfo.wifiList!=null && that._dataInfo.wifiList.length>0){
                        $.each(that._dataInfo.wifiList,function (i,item) {
                            var data = {
                                itemKey: item.id,
                                wifiAddress: item.address.split(':'),
                                wifiName:item.name
                            };
                            that._wifiList.push(data);
                            that.renderWifiAddData(data);
                        });
                    }
                    //打卡时间或班次
                    if(that._dataInfo.periodList!=null && that._dataInfo.periodList.length>0){
                        var key = 'a',$button = $(that.element).find('button[data-action="addTime"]');
                        if(that._dataInfo.ruleType==2){
                            key = 'b';
                            $button = $(that.element).find('button[data-action="addScheduling"]');
                        }
                        if(that._dataInfo.ruleType==3){
                            $.each(that._dataInfo.periodList,function (i,item) {
                                $(that.element).find('input[name="workDays"]').each(function () {
                                    if(item.workDays.indexOf($(this).val())>-1)
                                        $(this).iCheck('check');
                                });
                            });
                        }else{
                            $.each(that._dataInfo.periodList,function (i,item) {

                                if(item.id!='rest'){
                                    var data = item;
                                    data.itemKey = item.id;
                                    data.workDays = (item.workDays!=null && item.workDays.indexOf(',')>-1)?item.workDays.split(','):item.workDays;
                                    that._timeInfo[key].push(data);
                                    that.renderTimeAddData(key,$button);
                                }
                                if(that._dataInfo.ruleType==2)
                                    that._arrangeWorkList = that._arrangeWorkList.concat(item.arrangeWorkList);

                            });
                        }
                    }
                    //不用打卡的日期
                    if(that._dataInfo.notNeedClockDayList!=null && that._dataInfo.notNeedClockDayList.length>0){
                        that._dateNotMustBePunchedInfo = that._dataInfo.notNeedClockDayList;
                    }
                    //必须打卡的日期
                    if(that._dataInfo.needClockDayList!=null && that._dataInfo.needClockDayList.length>0){
                        that._dateMustBePunchedInfo = that._dataInfo.needClockDayList;
                        that.renderDatePunchedData(1);
                    }
                    //不用打卡的日期
                    if(that._dataInfo.notNeedClockDayList!=null && that._dataInfo.notNeedClockDayList.length>0){
                        that._dateNotMustBePunchedInfo = that._dataInfo.notNeedClockDayList;
                        that.renderDatePunchedData(2);
                    }
                })
            }
        }
        , render: function () {
            var that = this;
            var html = template('m_attendance/m_attendance_settings_add', {dataInfo:that._dataInfo});
            $(that.element).html(html);
            that.initICheck();
            that.initSelect();
            that.bindActionClick();
            that.save_validate();
        }
        //获取规则详情数据
        ,getAttendanceData:function (callBack) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_getAttendance;
            option.postData = {};
            option.postData.id = that.settings.id;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._dataInfo = response.data;
                    if(callBack)
                        callBack();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //初始化iCheck
        ,initICheck:function () {
            var that = this;
            $(that.element).find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            });
        }
        //初始化select
        ,initSelect:function () {
            var that = this;
            $(that.element).find('select.select-control').select2({
                allowClear: false,
                language: "zh-CN",
                containerCssClass:'select-sm',
                minimumResultsForSearch: Infinity
            });
        }
        //渲染已添加的打卡地点
        ,renderAddressAddData:function (data) {
            var that = this;
            var $addPosition = $(that.element).find('button[data-action="addPosition"]');
            var $box = $addPosition.parent().find('.attendance-data');
            if($box.length==0){
                $addPosition.parent().append('<div class="border m-t-xs attendance-data"></div>');
                $box = $addPosition.parent().find('.attendance-data');
            }
            var iHtml = '<div class="row"><div class="col-sm-12">' +
                '<div class="col-sm-4 p-h-xxs">&nbsp;'+data.punchCardName+'</div>' +
                '<div class="col-sm-6 p-h-xxs">'+data.address+' | '+data.punchRange+'米</div>' +
                '<div class="col-sm-2 p-h-xxs"><button class="btn btn-link no-padding" data-key="'+data.itemKey+'">删除</button></div></div></div>';

            $box.append(iHtml);
            $box.find('button').off('click').on('click',function () {
                var itemKey = $(this).attr('data-key');
                /*that._addressList.del(function (obj) {
                    return obj.itemKey == itemKey;
                });*/
                delObjectInArray(that._addressList,function (obj) {
                    return obj.itemKey == itemKey;
                });
                $(this).closest('.row').remove();
                if($box.find('.row').length==0)
                    $box.remove();
            });
        }
        //渲染已添加的打卡wift
        ,renderWifiAddData:function (data) {
            var that = this;
            var $button = $(that.element).find('button[data-action="addWiFi"]');
            var $box = $button.parent().find('.attendance-data');
            if($box.length==0){
                $button.parent().append('<div class="border m-t-xs attendance-data"></div>');
                $box = $button.parent().find('.attendance-data');
            }

            var wifiAddress = '';
            $.each(data.wifiAddress,function (i,item) {
                wifiAddress += ':'+ item;
            });
            wifiAddress = wifiAddress.substring(1,wifiAddress.length);

            var iHtml = '<div class="row"><div class="col-sm-12">' +
                '<div class="col-sm-4 p-h-xxs">&nbsp;'+data.wifiName+'</div>' +
                '<div class="col-sm-6 p-h-xxs">'+wifiAddress+'</div>' +
                '<div class="col-sm-2 p-h-xxs"><button class="btn btn-link no-padding" data-key="'+data.itemKey+'">删除</button></div></div></div>';

            $box.append(iHtml);
            $box.find('button').off('click').on('click',function () {
                var itemKey = $(this).attr('data-key');
                /*that._wifiList.del(function (obj) {
                    return obj.itemKey == itemKey;
                });*/

                delObjectInArray(that._wifiList,function (obj) {
                    return obj.itemKey == itemKey;
                });
                $(this).closest('.row').remove();
                if($box.find('.row').length==0)
                    $box.remove();
            });
        }
        //渲染已添加的打卡时段
        ,renderTimeAddData:function (key,$button) {
            var that = this;
            var $box = $button.parent().find('.attendance-data');
            if($box.length==0){
                $button.parent().append('<div class="border m-t-xs attendance-data"></div>');
                $box = $button.parent().find('.attendance-data');
            }else{
                $box.html('');
            }

            var converTitle = function (item) {
                var title = '';
                switch (item){
                    case '1':
                        title = '周一';
                        break;
                    case '2':
                        title = '周二';
                        break;
                    case '3':
                        title = '周三';
                        break;
                    case '4':
                        title = '周四';
                        break;
                    case '5':
                        title = '周五';
                        break;
                    case '6':
                        title = '周六';
                        break;
                    case '7':
                        title = '周日';
                        break;
                }
                return title;
            };

            if(that._timeInfo[key]!=null && that._timeInfo[key].length>0){

                $.each(that._timeInfo[key],function (index,data) {
                    var timeTitle = '';
                    if(data.workDays!=null && typeof data.workDays==='object' && data.workDays.length>0){
                        $.each(data.workDays,function (i,item) {
                            var title = converTitle(item);
                            timeTitle += '、' + title ;
                        });
                        timeTitle = timeTitle.substring(1,timeTitle.length);
                        if(data.workDays.length>4){
                            var interval = parseInt(data.workDays[data.workDays.length-1]) - parseInt(data.workDays[0]);
                            if(interval==data.workDays.length-1)
                                timeTitle = converTitle(data.workDays[0])+'至'+converTitle(data.workDays[data.workDays.length-1]);
                        }
                    }
                    else if(data.workDays!=null && typeof data.workDays==='string'){
                        timeTitle = converTitle(data.workDays);
                    }

                    if(!isNullOrBlank(data.classesName))
                        timeTitle = data.classesName;


                    var timeList = '';
                    $.each(data.timeList,function (i,item) {
                        timeList += '<p>上班'+item.startTime+'-下班'+item.endTime+'</p>';
                    });

                    var iHtml = '<div class="row" data-key="'+data.itemKey+'"><div class="col-sm-12">' +
                        '<div class="col-sm-4 p-h-xxs">&nbsp;'+timeTitle+'</div>' +
                        '<div class="col-sm-6 p-h-xxs">'+timeList+'</div>' +
                        '<div class="col-sm-2 p-h-xxs"><button class="btn btn-link no-padding edit">编辑</button>&nbsp;|&nbsp;<button class="btn btn-link no-padding del">删除</button></div></div></div>';

                    $box.append(iHtml);
                })
            }

            $box.find('button.del').off('click').on('click',function () {
                $(this).closest('.row').remove();
                //that._timeInfo.splice(that._timeInfo.length - 1, 1);
                var timeInfo = $.extend(true, [], that._timeInfo[key]);
                var itemKey = $(this).closest('.row').attr('data-key');
                $.each(timeInfo,function (i,item) {
                    if(itemKey==item.itemKey)
                        that._timeInfo[key].splice(i, 1);
                    return false;
                });
                if($box.find('.row').length==0)
                    $box.remove();
            });
            $box.find('button.edit').off('click').on('click',function () {
                var timeInfo = $.extend(true, [], that._timeInfo[key]);
                var itemKey = $(this).closest('.row').attr('data-key');
                var ruleType = $(that.element).find('input[name="ruleType"]:checked').val();
                $('body').m_attendance_time_add({
                    dataInfo:that._timeInfo[key],
                    itemKey:itemKey,
                    ruleType:ruleType,
                    okCallBack:function (data) {
                        var cloneData = $.extend(true, {}, data);
                        $.each(timeInfo,function (i,item) {
                            if(itemKey==item.itemKey){
                                that._timeInfo[key][i] = cloneData;
                                return false;
                            }
                        });
                        that.renderTimeAddData(key,$button);
                    }
                },true);
                return false;
            });
        }
        //渲染特殊日期
        ,renderDatePunchedData:function (t) {
            var that = this;

            var $button = $(that.element).find('button[data-action="dateMustBePunched"]');

            var dataInfo = [];
            if(t==1){
                dataInfo = that._dateMustBePunchedInfo;
            }else{
                dataInfo = that._dateNotMustBePunchedInfo;
                $button = $(that.element).find('button[data-action="dateNotMustBePunched"]');
            }

            var $box = $button.parent().find('.attendance-data');
            if($box.length==0){
                $button.parent().append('<div class="border m-t-xs attendance-data"></div>');
                $box = $button.parent().find('.attendance-data');
            }else{
                $box.html('');
            }

            if(dataInfo!=null && dataInfo.length>0){

                $.each(dataInfo,function (index,data) {

                    var timeList = '';
                    if(data.timeList!=null && data.timeList.length>0){
                        $.each(data.timeList,function (i,item) {
                            timeList += '<p>上班'+item.startTime+'-下班'+item.endTime+'</p>';
                        });
                    }
                    timeList+='<P>'+data.reason+'</P>';

                    var iHtml = '<div class="row" data-key="'+data.id+'"><div class="col-sm-12">' +
                        '<div class="col-sm-4 p-h-xxs">&nbsp;'+data.specialDate+'</div>' +
                        '<div class="col-sm-6 p-h-xxs">'+timeList+'</div>' +
                        '<div class="col-sm-2 p-h-xxs"><button class="btn btn-link no-padding edit">编辑</button>&nbsp;|&nbsp;<button class="btn btn-link no-padding del">删除</button></div></div></div>';

                    $box.append(iHtml);
                })
            }

            $box.find('button.del').off('click').on('click',function () {
                $(this).closest('.row').remove();
                var timeInfo = $.extend(true, [], dataInfo);
                var itemKey = $(this).closest('.row').attr('data-key');
                $.each(timeInfo,function (i,item) {
                    if(itemKey==item.id)
                        dataInfo.splice(i, 1);
                    return false;
                });
                if($box.find('.row').length==0)
                    $box.remove();
            });
            $box.find('button.edit').off('click').on('click',function () {
                var timeInfo = $.extend(true, [], dataInfo);
                var itemKey = $(this).closest('.row').attr('data-key');

                $('body').m_attendance_date_punched({
                    dataInfo:dataInfo,
                    id:itemKey,
                    dataType : t,
                    okCallBack:function (data) {
                        $.each(timeInfo,function (i,item) {
                            if(itemKey==item.id)
                                dataInfo[i] = $.extend(true, {}, data);
                            return false;
                        });
                        that.renderDatePunchedData(data);
                    }
                },true);
                return false;
            });
        }
        //渲染组织或人员选择
        ,renderAttendanceUser:function (data,$this) {
            var that = this;
            var ruleUserType = $this.attr('data-type');
            $this.parent().find('span.label').remove();
            if(data!=null && data.length>0){
                $.each(data,function (i,item) {
                    var icon = that.getIcon(item.type);
                    var iHtml = '<span class="label m-r-xs" data-id="'+item.id+'"><i class="'+icon+'"></i>&nbsp;'+item.text+'<a href="javascript:void(0);" class="curp" data-action="delPuncher"><i class="fa fa-times fc-red"></i></a></span>'
                    $this.before(iHtml);
                });
                $this.parent().find('a[data-action="delPuncher"]').off('click').on('click',function () {

                    var id = $(this).parents('span.label').attr('data-id');
                    delObjectInArray(that._attendanceUser[ruleUserType],function (obj) {
                        return obj.id == id;
                    });
                    $(this).parents('span.label').remove();
                });
            }
        }
        ,getIcon:function (type) {
            var that = this,icon='';
            switch (type){
                case 'independent':   //独立经营图标
                    icon='fa fa-users';
                break;
                case 'partner':   //事业合伙人图标
                    icon='iconfont rounded icon-cooperation';
                    break;
                case 'partnerContainer':   //事业合伙人容器图标
                    icon='iconfont rounded icon-cooperation';
                    break;
                case 'subCompany':   //分支机构图标
                    icon='iconfont rounded icon-2fengongsi1';
                    break;
                case 'subCompanyContainer':   //分支机构容器图标
                    icon='iconfont rounded icon-2fengongsi1';
                    break;
                case 'company':   //根节点图标
                    icon='iconfont rounded icon-2fengongsi';
                    break;
                case 'depart':   //独立经营图标
                    icon='iconfont rounded icon-zuzhijiagou';
                    break;
                case 'root':   //根节点图标
                    icon='fa fa-building';
                    break;
                default:   //独立经营图标
                    icon='fa fa-users';
                    break;
            }
            return icon;
        }
        //保存
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = that.settings.id==null?restApi.url_saveAttendanceSetting:restApi.url_updateAttendanceSetting;

            var data = $(that.element).find('form').serializeObject();

            //打卡人员
            if(that._attendanceUser[1]!=null && that._attendanceUser[1].length>0){
                data.attendanceUserList = [];
                $.each(that._attendanceUser[1],function (i,item) {
                    data.attendanceUserList.push({orgId:item.id,ruleUserType:1});
                })
            }else{
                S_toastr.error('请设置打卡人员');
                return false;
            }
            //白名单
            if(that._attendanceUser[2]!=null && that._attendanceUser[2].length>0){
                data.whiteUserList = [];
                $.each(that._attendanceUser[2],function (i,item) {
                    data.whiteUserList.push({orgId:item.id,ruleUserType:2});
                })
            }
            //汇报对象
            if(that._attendanceUser[3]!=null && that._attendanceUser[3].length>0){
                data.reportToUserList = [];
                $.each(that._attendanceUser[3],function (i,item) {
                    data.reportToUserList.push({orgId:item.id,ruleUserType:3});
                })
            }

            if(that._addressList.length==0 && that._wifiList.length==0){
                S_toastr.error('请添加打卡位置或WiFi');
                return false;
            }

            //打卡地点
            if(that._addressList && that._addressList.length>0){
                data.addressList = [];
                $.each(that._addressList,function (i,item) {
                    data.addressList.push({name:item.punchCardName,address:item.address,distance:parseInt(item.punchRange),lat:item.point.lat,lng:item.point.lng,type:1});
                })
            }
            //wifi设置
            if(that._wifiList && that._wifiList.length>0){
                data.wifiList = [];
                $.each(that._wifiList,function (i,item) {
                    var address = '';
                    $.each(item.wifiAddress,function (si,sitem) {
                       address += ':'+sitem;
                    });
                    address = address.substring(1,address.length);
                    data.wifiList.push({name:item.wifiName,address:address,type:2});
                })
            }
            //打卡时间
            if(data.ruleType=='1'){

                if(that._timeInfo['a'] && that._timeInfo['a'].length>0){
                    data.periodList = [];
                    $.each(that._timeInfo['a'],function (i,item) {

                        data.periodList.push({
                            workDays:item.workDays.join(','),
                            elasticTime:item.elasticTime,
                            limitClock:item.limitClock,
                            isNotClockOff:item.isNotClockOff,
                            timeList:item.timeList
                        });
                    })
                }else{
                    S_toastr.error('请添加打卡时间');
                    return false;
                }
            }
            else if(data.ruleType=='2'){

                data.periodList = [];

                //设置的班次
                if(that._timeInfo['b'] && that._timeInfo['b'].length>0){

                    $.each(that._timeInfo['b'],function (i,item) {

                        var arrangeWorkList = [];

                        $.each(that._arrangeWorkList,function (si,sitem) {
                            if(sitem.periodId==item.itemKey){
                                arrangeWorkList.push({
                                    companyUserId:sitem.companyUserId,
                                    workDate:sitem.workDate
                                });
                            }
                        });
                        data.periodList.push({
                            classesName:item.classesName,
                            elasticTime:item.elasticTime,
                            limitClock:item.limitClock,
                            isNotClockOff:item.isNotClockOff,
                            timeList:item.timeList,
                            arrangeWorkList:arrangeWorkList
                        });
                    })
                }else{
                    S_toastr.error('请添加打卡班次');
                    return false;
                }
                //默认的休息班次
                var restWorkList = [];
                $.each(that._arrangeWorkList,function (si,sitem) {
                    if(sitem.periodId=='rest')
                        restWorkList.push({companyUserId:sitem.companyUserId,workDate:sitem.workDate})
                });
                data.periodList.push({
                    id:'rest',
                    arrangeWorkList:restWorkList
                });
            }
            else if(data.ruleType=='3'){
                data.periodList = [];
                if(typeof data.workDays === 'object'){
                    data.periodList.push({
                        workDays:data.workDays.join(',')
                    })
                }else{
                    if(!isNullOrBlank(data.workDays)){
                        data.periodList.push({
                            workDays:data.workDays
                        })
                    }else{
                        S_toastr.error('请设置打卡时间');
                        return false;
                    }
                }
            }

            //必须要打卡的日期
            if(that._dateMustBePunchedInfo && that._dateMustBePunchedInfo.length>0){
                data.needClockDayList = [];
                $.each(that._dateMustBePunchedInfo,function (i,item) {
                    data.needClockDayList.push({
                        specialType:1,
                        specialDate:item.specialDate,
                        reason:item.reason,
                        timeList:item.timeList
                    });
                })
            }
            //不要打卡的日期
            if(that._dateNotMustBePunchedInfo && that._dateNotMustBePunchedInfo.length>0){
                data.notNeedClockDayList = [];
                $.each(that._dateNotMustBePunchedInfo,function (i,item) {
                    data.notNeedClockDayList.push({
                        specialType:2,
                        specialDate:item.specialDate,
                        reason:item.reason
                    });
                })
            }

            if(isNullOrBlank(data.effectWay)){
                S_toastr.error('请设置规则生效时间');
                return false;
            }


            option.postData = data;
            if(that.settings.id!=null)
                option.postData.id = that.settings.id;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,getUserListByOrgIds:function (callBack) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_getUserData;
            //打卡人员
            if(that._attendanceUser[1]==null || that._attendanceUser[1].length==0){
                return false;
            }

            option.postData = {};
            option.postData.orgTreeDetailList = that._attendanceUser[1];
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._attendanceUserList = response.data;
                    if(callBack)
                        callBack();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function (e) {
                var $this = $(this),dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'addAttendanceUser'://添加打卡人员(1：需要打卡的，2：白名单（不要打卡的），3：汇报对象)

                        var ruleUserType = $this.attr('data-type');
                        var isSelectUser = false;
                        if(ruleUserType=='2' || ruleUserType=='3')
                            isSelectUser = true;

                        $('body').m_select_org_users({
                            isSelectUser:isSelectUser,
                            selectedUserList:that._attendanceUser[ruleUserType],
                            okCallBack:function (data) {
                                that._attendanceUser[ruleUserType] = data;
                                that.renderAttendanceUser(data,$this);
                                //that.getUserListByOrgIds();
                            }
                        },true);
                        return false;
                        break;

                    case 'addPosition'://添加打卡位置

                        $('body').m_attendance_address_add({
                            okCallBack:function (data) {
                                that._addressList.push(data);
                                that.renderAddressAddData(data);
                            }
                        },true);
                        return false;
                        break;
                    case 'addWiFi'://添加打卡WiFi

                        $('body').m_attendance_wifi_add({
                            okCallBack:function (data) {
                                that._wifiList.push(data);
                                that.renderWifiAddData(data);
                            }
                        },true);
                        return false;
                        break;
                    case 'addTime'://添加打卡时间

                        $('body').m_attendance_time_add({
                            dataInfo:that._timeInfo['a'],
                            ruleType:'1',
                            okCallBack:function (data) {
                                that._timeInfo['a'].push(data);
                                that.renderTimeAddData('a',$this);
                            }
                        },true);
                        return false;
                        break;
                    case 'addScheduling'://添加班次

                        $('body').m_attendance_time_add({
                            dataInfo:that._timeInfo['b'],
                            ruleType:'2',
                            okCallBack:function (data) {
                                that._timeInfo['b'].push(data);
                                that.renderTimeAddData('b',$this);
                            }
                        },true);
                        return false;
                        break;
                    case 'editScheduling'://编辑排班
                        var ruleType = $(that.element).find('input[name="ruleType"]:checked').val();
                        if(that._timeInfo['b']==null || that._timeInfo['b'].length==0){
                            S_toastr.error('请设置班次');
                            return false;
                        }
                        var getUser = that.getUserListByOrgIds(function () {

                            if(that._attendanceUserList==null || that._attendanceUserList.length==0){
                                if(that._attendanceUser[1]!=null && that._attendanceUser[1].length>0){
                                    S_toastr.error('选择的部门成员为空');
                                }else{
                                    S_toastr.error('请添加打卡人员');
                                }
                                return false;
                            }
                            $('body').m_attendance_arrange_work({
                                periodList:that._timeInfo['b'],
                                userList:that._attendanceUserList,
                                arrangeWorkList:that._arrangeWorkList,
                                okCallBack:function (data) {
                                    that._arrangeWorkList = data;
                                }
                            },true);
                        });
                        if(getUser==false){
                            S_toastr.error('请添加打卡人员');
                            return false;
                        }
                        return false;
                        break;
                    case 'dateMustBePunched'://必须打卡的日期

                        $('body').m_attendance_date_punched({
                            dataInfo:that._dateMustBePunchedInfo,
                            dataType : 1,
                            okCallBack:function (data) {
                                that._dateMustBePunchedInfo.push(data);
                                that.renderDatePunchedData(1);
                            }
                        },true);
                        return false;
                        break;
                    case 'dateNotMustBePunched'://不用打卡的日期

                        $('body').m_attendance_date_punched({
                            dataInfo:that._dateNotMustBePunchedInfo,
                            dataType : 0,
                            okCallBack:function (data) {
                                that._dateNotMustBePunchedInfo.push(data);
                                that.renderDatePunchedData(0);
                            }
                        },true);
                        return false;
                        break;
                    case 'save'://保存
                        var flag = $(that.element).find('form').valid();
                        if (!flag || that.save()) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                        return false;
                        break;
                    case 'back'://返回
                        $(that.element).m_attendance_settings({}, true);
                        return false;
                        break;
                }
            });

            $(that.element).find('input[name="ruleType"]').on('ifClicked', function(e){
                var $this = $(this);
                var type = $(this).val();

                $(that.element).find('div[data-rule-type]').hide();
                $(that.element).find('div[data-rule-type="'+type+'"]').show();

                stopPropagation(e);
                return false;
            });
        }
        //表单验证
        ,save_validate:function(){
            var that = this;
            $(that.element).find('form.form-horizontal').validate({
                ignore : [],
                rules: {
                    ruleName: {
                        required: true
                    }
                },
                messages: {
                    ruleName: {
                        required: '请输入规则名称'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-sm-10'));
                }
            });
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
